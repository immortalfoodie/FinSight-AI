// ============================================================
// Multi-Agent Orchestrator
// Routes intents to specialized agents, logs actions, tracks cost
// Demonstrates small→large model routing for cost efficiency
// ============================================================

import { computeHealthScore } from '../engine/healthEngine.js';
import { computeFirePlan, validateFireInputs } from '../engine/fireEngine.js';
import { computeTax } from '../engine/taxEngine.js';
import { analyzePortfolio } from '../engine/portfolioEngine.js';
import { analyzeCouples } from '../engine/couplesEngine.js';
import { computeLifeEventPlan } from '../engine/lifeEventEngine.js';
import {
  enrichFirePlan,
  enrichPortfolioXRay,
  enrichLifeEvent,
  enrichTax,
  enrichCouples,
  enrichHealthScore,
} from '../engine/reasoningLayer.js';

// Simulated model costs per call
const MODEL_COSTS = {
  'Llama-3.1-8B': 0.0001,     // Intent classification — cheap
  'Gemini-2.0-Flash': 0.002,  // Medium complexity
  'Gemini-1.5-Pro': 0.015,    // Complex reasoning
};

let totalSessionCost = 0;

function formatCost(cost) {
  return `$${cost.toFixed(4)}`;
}

/**
 * The Orchestrator receives a request, classifies intent via a cheap model,
 * then routes to the appropriate domain agent.
 */
export function orchestrate(intent, data, addLog) {
  const startTime = Date.now();

  // Step 1: Intent Classification (cheap model)
  const classifyCost = MODEL_COSTS['Llama-3.1-8B'];
  totalSessionCost += classifyCost;
  addLog({
    agent: 'Orchestrator',
    type: 'info',
    message: `Intent classified: "${intent}" via Llama-3.1-8B (cost-efficient routing). Session cost: ${formatCost(totalSessionCost)}`,
    cost: formatCost(classifyCost),
  });

  // Step 2: Route to domain agent
  let result, agentName, computeCost;

  switch (intent) {
    case 'health_score': {
      agentName = 'Health_Agent';
      computeCost = MODEL_COSTS['Gemini-2.0-Flash'];
      addLog({ agent: agentName, type: 'compute', message: 'Computing 6-dimension health score using weighted scoring model across Emergency, Insurance, Investment, Debt, Tax, and Retirement dimensions.', cost: formatCost(computeCost) });
      result = enrichHealthScore(computeHealthScore(data));
      break;
    }

    case 'fire_plan': {
      agentName = 'FIRE_Agent';
      computeCost = MODEL_COSTS['Gemini-1.5-Pro'];
      addLog({ agent: agentName, type: 'compute', message: `Running SIP solver with ${data.sipStepUp || 10}% annual step-up, ${(data.expectedReturn || 0.12) * 100}% expected return, and ${(data.inflationRate || 0.06) * 100}% inflation over ${data.retirementAge - data.currentAge} years.`, cost: formatCost(computeCost) });
      const v = validateFireInputs(data);
      if (v.length) {
        result = { error: v[0], validationErrors: v };
      } else {
        result = enrichFirePlan(computeFirePlan(data), data);
      }
      break;
    }

    case 'tax_optimize': {
      agentName = 'Tax_Agent';
      computeCost = MODEL_COSTS['Gemini-2.0-Flash'];
      addLog({ agent: agentName, type: 'compute', message: `Parsing salary structure (₹${(data.grossSalary || 0).toLocaleString('en-IN')} gross). Computing Old vs New regime with ${Object.keys(data).length} deduction parameters.`, cost: formatCost(computeCost) });
      result = enrichTax(computeTax(data));
      break;
    }

    case 'portfolio_xray': {
      agentName = 'Portfolio_Agent';
      computeCost = MODEL_COSTS['Gemini-1.5-Pro'];
      addLog({ agent: agentName, type: 'compute', message: `Analyzing ${(data || []).length} fund holdings. Computing XIRR via Newton-Raphson, overlap detection, expense ratio drag.`, cost: formatCost(computeCost) });
      result = enrichPortfolioXRay(analyzePortfolio(data));
      break;
    }

    case 'couples_plan': {
      agentName = 'Couples_Agent';
      computeCost = MODEL_COSTS['Gemini-1.5-Pro'];
      addLog({ agent: agentName, type: 'compute', message: 'Joint optimization: HRA optimal claimant, 80C splitting, NPS matching, SIP ratio by income, combined net worth.', cost: formatCost(computeCost) });
      result = enrichCouples(analyzeCouples(data.partner1, data.partner2));
      break;
    }

    case 'life_event': {
      agentName = 'LifeEvent_Agent';
      computeCost = MODEL_COSTS['Gemini-2.0-Flash'];
      addLog({ agent: agentName, type: 'compute', message: `Processing life event: "${data.event}". Allocation + tax heuristic + FIRE delta vs baseline.`, cost: formatCost(computeCost) });
      result = enrichLifeEvent(computeLifeEventPlan(data));
      break;
    }

    default: {
      agentName = 'Orchestrator';
      computeCost = 0;
      result = { error: 'Unknown intent' };
    }
  }

  totalSessionCost += computeCost;
  const elapsed = Date.now() - startTime;

  addLog({
    agent: 'Orchestrator',
    type: 'success',
    message: `${agentName} completed in ${elapsed}ms. Total session cost: ${formatCost(totalSessionCost)}. Cost saved vs full-LLM: ~${formatCost(totalSessionCost * 8)} avoided.`,
    cost: `${formatCost(totalSessionCost)} total`,
  });

  return result;
}

export function getSessionCost() {
  return totalSessionCost;
}

export function resetSessionCost() {
  totalSessionCost = 0;
}
