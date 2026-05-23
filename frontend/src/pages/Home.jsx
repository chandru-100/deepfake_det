import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const [activeTab, setActiveTab] = useState('image');
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] pt-10">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900 tracking-tight">
          Deepfake Image Detection Online
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Our Deepfake detection tool gives you a precise authenticity score. Protect your content with real-time analysis, designed for security and simplicity.
        </p>
        
        {/* Toggle Buttons */}
        <div className="flex justify-center mt-8 gap-2 bg-gray-100 p-1 rounded-full w-max mx-auto">
          <button 
            onClick={() => setActiveTab('image')}
            className={`px-8 py-2 rounded-full font-medium transition-colors ${activeTab === 'image' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Image
          </button>
          <button 
            onClick={() => setActiveTab('video')}
            className={`px-8 py-2 rounded-full font-medium transition-colors ${activeTab === 'video' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Video
          </button>
        </div>
      </motion.div>

      {/* Upload Box ONLY */}
      <div className="w-full max-w-2xl mb-24">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8 flex flex-col items-center justify-center min-h-[350px]">
          <div 
            onClick={() => navigate('/scan')}
            className="border-2 border-dashed border-primary/40 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-blue-50/50 transition-all w-full h-full"
          >
            <UploadCloud className="w-16 h-16 text-primary mb-6" strokeWidth={1.5} />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Drag & drop an {activeTab} or click</h3>
            <p className="text-gray-500 uppercase text-sm font-medium tracking-wide">
              {activeTab === 'image' ? 'PNG, JPG, WEBP up to 10 MB' : 'MP4, MOV, WEBM up to 50 MB'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
