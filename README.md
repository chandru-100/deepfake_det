# Deepfake Detection Scanner 🕵️‍♂️🔍

A professional, full-stack Deepfake Detection application built for academic and demonstration purposes. It utilizes a powerful Hybrid AI Ensemble combined with a Forensic Rule Engine to accurately analyze images and videos for signs of AI generation or manipulation.

## 🚀 Features
* **Hybrid AI Ensemble**: Leverages Hugging Face's `umm-maybe/AI-image-detector` to calculate baseline authenticity.
* **Forensic Rule Engine**: Analyzes hidden EXIF metadata, compression artifacts, blur variance, and facial symmetry. If AI software tags (like Stable Diffusion or Midjourney) are found, it triggers a **Critical Override** to forcefully flag the image as Fake.
* **Video Support**: Automatically extracts frames from `.mp4` uploads using `ffmpeg` for multi-frame deepfake analysis.
* **Serverless Database**: Uses a zero-config `SQLite3` database to store scan history and user reports.
* **Modern React UI**: Beautiful, dynamic interface built with Vite and Tailwind CSS.

## 📋 Prerequisites
Before you begin, ensure you have the following installed:
* [Node.js](https://nodejs.org/en/) (v16 or higher)
* [FFmpeg](https://ffmpeg.org/download.html) (Required for video frame extraction)
* A [Hugging Face](https://huggingface.co/) Account (To get a free API Inference Key)

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/chandru-100/deepfake_det.git
cd deepfake_det
```

### 2. Configure the Backend
Navigate to the backend directory and install the dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory and add your Hugging Face API key:
```env
PORT=5002
HF_API_KEY=your_huggingface_api_key_here
```
*(The backend will automatically create the `uploads/` directory and initialize `database.sqlite` on first run).*

### 3. Configure the Frontend
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

## 🏃‍♂️ Running the Application

**Start the Backend Server:**
```bash
cd backend
npm run dev
```
*(The backend will run on `http://localhost:5002`)*

**Start the Frontend Application:**
```bash
cd frontend
npm run dev
```
*(The frontend will be available at `http://localhost:5174`)*

## ⚖️ Scoring Logic
The final Authenticity Score is calculated using a 60/40 weighted split between the AI model and the Forensic Rule Engine:
* **85% - 100%**: Real ✅
* **75% - 84%**: Almost Real ✅
* **45% - 74%**: Suspicious ⚠️
* **0% - 44%**: Fake ❌
