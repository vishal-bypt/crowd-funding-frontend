import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const ABI = [
  { "inputs":[{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"goal","type":"uint256"},{"internalType":"uint256","name":"durationSeconds","type":"uint256"}],"name":"createCampaign","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  { "inputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"}],"name":"contribute","outputs":[],"stateMutability":"payable","type":"function"},
  { "inputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"}],"name":"getContributors","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
  { "inputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"}],"name":"getCampaign","outputs":[{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"goal","type":"uint256"},{"internalType":"uint256","name":"pledged","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"withdrawn","type":"bool"}],"internalType":"struct Crowdfund.Campaign","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
  { "inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"contributions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

export async function GET() {
  try {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backend) {
      const res = await fetch(backend + '/api/campaigns');
      const data = await res.json();
      return NextResponse.json(data);
    }

    const rpc = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) return NextResponse.json([]);

    const provider = new ethers.JsonRpcProvider(rpc);
    const campaigns = [];
    for (let i = 0; i < 50; i++) {
      try {
        const iface = new ethers.Interface(ABI);
        const data = await provider.call({
          to: contractAddress,
          data: iface.encodeFunctionData('getCampaign', [i])
        });
        const decoded = iface.decodeFunctionResult('getCampaign', data);
        const campaign = decoded[0];
        const contribData = await provider.call({
          to: contractAddress,
          data: iface.encodeFunctionData('getContributors', [i])
        });
        const contribs = iface.decodeFunctionResult('getContributors', contribData)[0];
        const holders = [];
        let total = 0n;
        for (const a of contribs) {
          const amtData = await provider.call({
            to: contractAddress,
            data: iface.encodeFunctionData('contributions', [i, a])
          });
          const amt = BigInt(iface.decodeFunctionResult('contributions', amtData)[0].toString());
          holders.push({ address: a, amount: amt.toString() });
          total += amt;
        }
        const holdersWithPct = holders.map(h => ({
          address: h.address,
          amount: h.amount,
          pct: total === 0n ? '0.00' : (Number((BigInt(h.amount) * 10000n) / total) / 100).toFixed(2)
        }));
        campaigns.push({
          id: i,
          title: campaign.title,
          description: campaign.description,
          goal: campaign.goal.toString(),
          pledged: campaign.pledged.toString(),
          deadline: Number(campaign.deadline),
          withdrawn: campaign.withdrawn,
          holders: holdersWithPct
        });
      } catch (e) {
        break;
      }
    }
    return NextResponse.json(campaigns);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
