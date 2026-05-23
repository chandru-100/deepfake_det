import React, { useState } from 'react';
import axios from 'axios';
import { Send, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const Report = () => {
  const [formData, setFormData] = useState({ media_link: '', reason: '' });
  const [status, setStatus] = useState({ submitting: false, message: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, message: '', type: '' });

    try {
      await axios.post('http://localhost:5002/api/reports', formData);
      setStatus({ submitting: false, message: 'Report submitted successfully. Thank you for helping!', type: 'success' });
      setFormData({ media_link: '', reason: '' });
    } catch (error) {
      console.error(error);
      setStatus({ submitting: false, message: 'Failed to submit report. Please try again.', type: 'error' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="text-center mb-10">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Report <span className="text-gradient">Fake Media</span></h1>
        <p className="text-gray-600">Help us stop the spread of misinformation by reporting suspicious content.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Media Link / URL</label>
            <input 
              type="url" 
              required
              value={formData.media_link}
              onChange={(e) => setFormData({...formData, media_link: e.target.value})}
              placeholder="https://example.com/suspicious-video"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Reporting</label>
            <textarea 
              required
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              placeholder="Describe why you think this media is manipulated..."
              rows={5}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-gray-900 resize-none"
            ></textarea>
          </div>

          {status.message && (
            <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {status.message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={status.submitting}
            className="bg-primary hover:bg-indigo-500 text-white font-bold py-4 rounded-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {status.submitting ? 'Submitting...' : <><Send className="w-5 h-5"/> Submit Report</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Report;
