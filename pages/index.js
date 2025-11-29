import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        const url = base ? `${base}/api/campaigns` : '/api/contract';
        console.log("url", url);
        const res = await axios.get(url);
        setCampaigns(res.data || []);
      } catch (e) {
        console.error(e);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1 style={{margin:0}}>Crowdfund Demo</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
          <Link href="/campaign/create">
            <button className="button">Create Campaign</button>
          </Link>
          <a className="link" target='_blank' href="https://sepolia.etherscan.io/bytecode-decompiler?a=0x8882a277002a0acc78fdd5326708757f57fa33e6">Smart Contract</a>
          <a className="link" target='_blank' href="https://sepolia.etherscan.io/address/0x381d74AAd2F4275Def7F4faaFc0B895aeC3C111b">Transactions</a>
        </div>
      </div>

      <div className="card">
        <h2 style={{marginTop:0}}>Campaigns</h2>
        {loading && <p className="small">Loading campaigns…</p>}
        {!loading && campaigns.length === 0 && <p className="small">No campaigns found. Deploy contract & create campaigns (see README).</p>}
        <div className="list">
          {campaigns.map(c => (
            <div key={c.id} className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600}}>{c.title || `Campaign #${c.id}`}</div>
                <div className="small">{c.description || ''}</div>
                <div className="small">Goal: {formatWei(c.goal)} ETH — Pledged: {formatWei(c.pledged)} ETH</div>
              </div>
              <div>
                <Link href={`/campaign/${c.id}`}><button className="button">View</button></Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="footer">
        <p>Tip: If you run a local backend, set <code>NEXT_PUBLIC_BACKEND_URL</code> to its address (e.g. http://localhost:4000)</p>
      </div>
    </div>
  );
}

function formatWei(wei) {
  try {
    const n = BigInt(wei || '0');
    // convert to ether with 18 decimals
    const whole = n / 1000000000000000000n;
    const rem = n % 1000000000000000000n;
    const frac = String(rem).padStart(18,'0').slice(0,6); // 6 decimals
    return `${whole.toString()}.${frac}`;
  } catch (e) {
    return '0';
  }
}
