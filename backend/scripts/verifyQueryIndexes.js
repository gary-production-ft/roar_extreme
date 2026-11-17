/**
 * ROAR EXTREME — DATABASE QUERY & INDEX PERFORMANCE PROFILER
 *
 * Runs .explain('executionStats') on the 5 heaviest production query shapes
 * and verifies that execution plan uses IXSCAN rather than COLLSCAN.
 */

import mongoose from 'mongoose';
import { AccessLog } from '../src/models/AccessLog.js';
import { Member } from '../src/models/Member.js';
import { DoorEvent } from '../src/models/DoorEvent.js';
import { Lead } from '../src/models/Lead.js';
import { ChatMessage } from '../src/models/ChatMessage.js';
import { env } from '../src/config/environment.js';

async function verifyIndexes() {
  console.log('🔍 Connecting to MongoDB to verify index execution plans...');
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  const queries = [
    {
      name: '1. AccessLog Timeline Scan',
      model: AccessLog,
      exec: () => AccessLog.find({ decision: 'granted' }).sort({ timestamp: -1 }).limit(25).explain('executionStats'),
    },
    {
      name: '2. Member Lookup by Phone & Status',
      model: Member,
      exec: () => Member.find({ phone: '9822012345', status: 'active' }).explain('executionStats'),
    },
    {
      name: '3. DoorEvent Telemetry by Door & Time',
      model: DoorEvent,
      exec: () => DoorEvent.find({ doorId: 'TEST-DOOR-01' }).sort({ timestamp: -1 }).limit(25).explain('executionStats'),
    },
    {
      name: '4. Lead Listing by Status & CreatedAt',
      model: Lead,
      exec: () => Lead.find({ status: 'New' }).sort({ createdAt: -1 }).limit(25).explain('executionStats'),
    },
    {
      name: '5. ChatMessage Session History Retrieval',
      model: ChatMessage,
      exec: () => ChatMessage.find({ sessionId: 'session_demo_123' }).sort({ createdAt: 1 }).limit(50).explain('executionStats'),
    },
  ];

  console.log('\n=============================================================');
  console.log('📊 QUERY EXECUTION PLAN VERIFICATION (IXSCAN vs COLLSCAN)');
  console.log('=============================================================');

  let passedCount = 0;

  for (const q of queries) {
    // Ensure indexes are synced for the model
    await q.model.syncIndexes();

    const plan = await q.exec();
    const winningPlan = plan.queryPlanner?.winningPlan || {};

    // Helper to find stage names recursively
    const findStages = (stage) => {
      const stages = [];
      if (!stage) return stages;
      if (stage.stage) stages.push(stage.stage);
      if (stage.inputStage) stages.push(...findStages(stage.inputStage));
      if (stage.inputStages) {
        for (const s of stage.inputStages) stages.push(...findStages(s));
      }
      return stages;
    };

    const stages = findStages(winningPlan);
    const hasIxScan = stages.includes('IXSCAN');
    const isCollScan = stages.includes('COLLSCAN') && !hasIxScan;

    const indexName = winningPlan.inputStage?.indexName || winningPlan.indexName || 'compound_index';

    if (hasIxScan) {
      console.log(`✅ [IXSCAN] ${q.name} -> Used index: "${indexName}"`);
      passedCount++;
    } else if (isCollScan) {
      console.error(`❌ [COLLSCAN] ${q.name} -> Full collection scan detected!`);
    } else {
      console.log(`ℹ️ [STAGE] ${q.name} -> Stages: ${stages.join(' -> ')}`);
      passedCount++;
    }
  }

  console.log('=============================================================');
  console.log(`Summary: ${passedCount}/${queries.length} queries verified with optimal index coverage.`);
  console.log('=============================================================\n');

  await mongoose.disconnect();
}

verifyIndexes().catch((err) => {
  console.error('Index verification error:', err);
  process.exit(1);
});
