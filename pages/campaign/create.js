import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function CreateCampaign() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const url = base ? `${base}/api/campaigns` : '/api/contract';
      
      // Convert goal to Wei (1 ETH = 10^18 Wei)
      const goalInWei = BigInt(parseFloat(formData.goal) * 1000000000000000000);
      
      const response = await axios.post(url, {
        ...formData,
        durationSeconds : 86400, // 1 day in seconds
        goal: goalInWei.toString()
      });

      if (response.data) {
        router.push(`/`);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Create Campaign</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Campaign Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter campaign title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              className="input"
              placeholder="Describe your campaign"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal">Funding Goal (ETH)</label>
            <input
              type="number"
              id="goal"
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              required
              step="0.000001"
              min="0"
              className="input"
              placeholder="Enter amount in ETH"
            />
          </div>

          <button 
            type="submit" 
            className="button" 
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      </div>
    </div>
  );
}