import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const ABI = [
  { "inputs":[{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"goal","type":"uint256"},{"internalType":"uint256","name":"durationSeconds","type":"uint256"}],"name":"createCampaign","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},
  { "inputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"}],"name":"contribute","outputs":[],"stateMutability":"payable","type":"function"},
  { "inputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"}],"name":"getContributors","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
  { "inputs":[{"internalType":"uint256","name":"campaignId","type":"uint256"}],"name":"getCampaign","outputs":[{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"string","name":"title","type":"string"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"goal","type":"uint256"},{"internalType":"uint256","name":"pledged","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"withdrawn","type":"bool"}],"internalType":"struct Crowdfund.Campaign","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
  { "inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"contributions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
];

export default function CampaignPage() {
  const router = useRouter();
  const { id } = router.query;
  const [campaign, setCampaign] = useState(null);
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    load();
    async function load() {
      setLoading(true);
      try {
        const providerUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
        const provider = new ethers.JsonRpcProvider(providerUrl);
        const addr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (!addr) throw new Error('Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local');
        const contract = new ethers.Contract(addr, ABI, provider);
        const c = await contract.getCampaign(Number(id));
        const contribs = await contract.getContributors(Number(id));
        let total = 0n;
        const arr = [];
        for (const a of contribs) {
          const amt = await contract.contributions(Number(id), a);
          arr.push({ address: a, amount: amt });
          total += BigInt(amt.toString());
        }
        const holdersWithPct = arr.map(h => {
          const amtBig = BigInt(h.amount.toString());
          const pct = total === 0n ? '0.00' : (Number(amtBig * 10000n / total) / 100).toFixed(2);
          return { address: h.address, amountEth: formatWei(h.amount.toString()), pct };
        });
        setCampaign(c);
        setHolders(holdersWithPct);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  }, [id]);

  async function contribute() {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask');
        return;
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const contract = new ethers.Contract(addr, ABI, signer);
      const tx = await contract.contribute(Number(id), { value: ethers.parseEther('0.01') });
      await tx.wait();
      alert('Contributed 0.01 ETH');
      router.reload();
    } catch (e) {
      console.error(e);
      alert('Error: ' + (e.message || e));
    }
  }

  return (
    <div className="container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <button className="button" onClick={() => router.push('/')}>Back</button>
        <h1 style={{margin:0}}>Campaign {id}</h1>
      </div>

      <div className="card">
        {loading && <p className="small">Loading…</p>}
        {!loading && !campaign && <p className="small">Campaign not found.</p>}
        {!loading && campaign && (
          <div>
            <p><strong>Title:</strong> {campaign.title}</p>
            <p><strong>Description:</strong> {campaign.description}</p>
            <p><strong>Goal:</strong> {formatWei(campaign.goal?.toString())} ETH</p>
            <p><strong>Pledged:</strong> {formatWei(campaign.pledged?.toString())} ETH</p>
            <div style={{marginTop:16}}>
              <button className="button" onClick={contribute}>Contribute 0.01 ETH</button>
            </div>

            <h3 style={{marginTop:24, marginBottom:12}}>Investors</h3>
            <div className="list">
              {holders.map(h => (
                <div key={h.address} className="small" style={{wordBreak: 'break-all'}}>
                  {h.address} — {h.amountEth} ETH — {h.pct}%
                </div>
              ))}
              {holders.length === 0 && (
                <div className="small">No investors yet.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatWei(wei) {
  try {
    const n = BigInt(wei || '0');
    const whole = n / 1000000000000000000n;
    const rem = n % 1000000000000000000n;
    const frac = String(rem).padStart(18,'0').slice(0,6);
    return `${whole.toString()}.${frac}`;
  } catch (e) {
    return '0';
  }
}
