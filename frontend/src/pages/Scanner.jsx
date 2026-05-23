import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertOctagon, Loader, File, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Scanner = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setResult(null);

    const formData = new FormData();
    formData.append('media', file);

    try {
      const response = await axios.post('http://localhost:5002/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setResult(response.data.data);
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Error analyzing media. Is the server running?');
    } finally {
      setScanning(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-accent border-accent shadow-accent/20';
    if (score >= 75) return 'text-secondary border-secondary shadow-secondary/20';
    if (score >= 45) return 'text-yellow-500 border-yellow-500 shadow-yellow-500/20';
    return 'text-red-500 border-red-500 shadow-red-500/20';
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Deepfake <span className="text-gradient">Scanner</span></h1>
        <p className="text-gray-400">Upload an image or video to verify its authenticity using our AI model.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold mb-6 border-b border-gray-200 pb-2 text-gray-900">Upload Media</h2>
          
          <label className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-gray-50 relative overflow-hidden group">
            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            <UploadCloud className="w-12 h-12 text-gray-400 group-hover:text-primary transition-colors mb-4" />
            <span className="text-lg font-medium text-gray-800">Click or drag file to upload</span>
            <span className="text-sm text-gray-500 mt-2">Supports JPG, PNG, MP4</span>
          </label>

          {file && (
            <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 overflow-hidden">
                <File className="w-6 h-6 text-primary flex-shrink-0" />
                <span className="truncate text-sm font-medium">{file.name}</span>
              </div>
              <button 
                onClick={handleScan}
                disabled={scanning}
                className="bg-primary hover:bg-indigo-500 px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50 flex items-center gap-2 ml-4"
              >
                {scanning ? <><Loader className="w-4 h-4 animate-spin" /> Scanning...</> : 'Scan Now'}
              </button>
            </div>
          )}
        </div>

        {/* Preview & Results Section */}
        <div className="glass-panel p-8 flex flex-col relative overflow-hidden">
          <h2 className="text-xl font-bold mb-6 border-b border-gray-200 pb-2 text-gray-900">Analysis Result</h2>
          
          <div className="flex-grow flex flex-col items-center justify-center relative">
            {!preview && !result && (
              <div className="text-gray-400 text-center flex flex-col items-center">
                <ShieldAlert className="w-16 h-16 opacity-20 mb-4" />
                <p>Upload a file to see preview and results here.</p>
              </div>
            )}

            {preview && (
              <div className="relative rounded-lg overflow-hidden border border-gray-200 w-full mb-6">
                {file?.type.startsWith('video') ? (
                   <video src={preview} controls className="w-full h-auto max-h-64 object-cover" />
                ) : (
                   <img src={preview} alt="Preview" className="w-full h-auto max-h-64 object-contain bg-background" />
                )}
                {scanning && <div className="scanner-overlay"></div>}
              </div>
            )}

            <AnimatePresence>
              {result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full bg-white rounded-xl p-6 border border-gray-200 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-600 font-medium">Authenticity Score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
                      {result.score}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${result.score}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-3 rounded-full ${result.score >= 85 ? 'bg-accent' : result.score >= 75 ? 'bg-secondary' : result.score >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    ></motion.div>
                  </div>

                  <div className="flex items-center gap-4">
                    {result.result === 'Real' || result.result === 'Almost Real' ? (
                      <CheckCircle className="w-8 h-8 text-accent" />
                    ) : (
                      <AlertOctagon className="w-8 h-8 text-red-500" />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{result.result}</h3>
                      <p className="text-sm text-gray-500">AI analysis completed.</p>
                    </div>
                  </div>


                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
