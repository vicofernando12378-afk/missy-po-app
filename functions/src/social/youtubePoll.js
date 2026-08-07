import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { getApiKeys } from '../lib/config.js';

import { processSocialEvent } from './processSocialEvent.js';

export const youtubePoll = onSchedule({
  schedule: '0 * * * *', // every 1 hour
  timeZone: 'America/Lima',
  retryCount: 1,
}, async (event) => {
  const db = getFirestore();
  console.log('🏁 Starting YouTube comments polling job...');

  const keys = await getApiKeys();
  const apiKey = keys.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ YOUTUBE_API_KEY is not configured. YouTube polling skipped.');
    return;
  }

  try {
    // 1. Fetch channel config dynamically from Firestore
    const configSnap = await db.collection('myp_config').doc('youtube').get();
    if (!configSnap.exists) {
      console.log('ℹ️ No YouTube channel config found in myp_config/youtube. Polling skipped.');
      return;
    }

    const { channelId, lastPolledAt } = configSnap.data();
    if (!channelId) {
      console.log('ℹ️ channelId is empty in myp_config/youtube. Polling skipped.');
      return;
    }

    console.log(`ℹ️ Polling YouTube channel: ${channelId}`);

    // 2. Fetch comments from YouTube API
    // Part = snippet returns top-level comments
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${channelId}&maxResults=50&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const threads = data.items || [];
    console.log(`ℹ️ Retrieved ${threads.length} comment threads.`);

    // 3. Process new comments
    // Lookback time: if lastPolledAt exists, use it. Otherwise look back 35 minutes.
    const lookbackLimit = lastPolledAt
      ? lastPolledAt.toDate()
      : new Date(Date.now() - 35 * 60 * 1000);

    let processedCount = 0;

    for (const thread of threads) {
      const commentSnippet = thread.snippet?.topLevelComment?.snippet;
      if (!commentSnippet) continue;

      const publishedAt = new Date(commentSnippet.publishedAt);

      // Only process comments published after our last poll
      if (publishedAt <= lookbackLimit) continue;

      // Skip comments written by the channel owner itself to avoid loops/echoes
      if (commentSnippet.authorChannelId?.value === channelId) continue;

      try {
        const result = await processSocialEvent({
          platform: 'youtube',
          type: 'comment',
          externalUserId: commentSnippet.authorChannelId?.value || 'unknown-yt',
          userName: commentSnippet.authorDisplayName || 'Usuario YouTube',
          content: commentSnippet.textDisplay || '',
          externalPostId: commentSnippet.videoId || null,
        });

        if (result.leadId) {
          processedCount++;
        }
      } catch (err) {
        console.error(`❌ Error processing YouTube comment ${thread.id}:`, err);
      }
    }

    // 4. Update lastPolledAt timestamp in configuration
    await db.collection('myp_config').doc('youtube').update({
      lastPolledAt: Timestamp.fromDate(new Date()),
    });

    console.log(`✅ YouTube polling finished. Processed ${processedCount} leads/interactions.`);
  } catch (err) {
    console.error('❌ Error during YouTube polling:', err);
  }
});
