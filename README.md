# 🍕 Food 101 Conformal Classifier

A modern web application for classifying food images using a fine-tuned Vision Transformer (ViT) model with conformal prediction for uncertainty quantification.

![Python](https://img.shields.io/badge/Python-3.11+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Databricks](https://img.shields.io/badge/Databricks-Apps-orange)

## 🎯 Overview

This application provides a polished, professional interface for demonstrating the Food 101 image classification model with conformal prediction. Unlike traditional classifiers that output a single prediction, this model generates **adaptive prediction sets** that grow or shrink based on uncertainty, all while maintaining a 90% coverage guarantee.

### Key Innovation: Adaptive Prediction Sets

- **High-confidence predictions** yield small sets (1-2 classes)
- **Lower-confidence predictions** return wider sets of 3-6 classes
- Maintains a **90% coverage guarantee** across all predictions
- Offers a **model-agnostic, distribution-free** way to communicate uncertainty to stakeholders

**Code:** [food101-conformal-classifier](https://github.com/jonathan-whiteley/food101-conformal-classifier)

## ✨ Features

- 🖼️ **Simple image upload** with drag-and-drop support
- 🎯 **Instant classification** with confidence scores
- 📊 **Prediction sets** showing multiple possibilities ordered by confidence
- 🎨 **Modern, responsive UI** built with React and shadcn/ui
- ⚡ **Real-time results** from Databricks model serving endpoint
- 🔄 **Adaptive feedback** for slow endpoint spin-up times

## 🏗️ Architecture

### Backend
- **FastAPI** - High-performance Python web framework
- **Databricks SDK** - Model serving endpoint integration
- **Python 3.11+** - Modern Python features

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** - Lightning-fast build tool and dev server
- **shadcn/ui** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management

### ML Model
- **Vision Transformer (ViT)** - Fine-tuned google/vit-base-patch16-224-in21k
- **Dataset** - nateraw/food101 (101 food categories)
- **Performance** - 84.53% accuracy on evaluation set
- **Conformal Prediction** for uncertainty quantification
- **Databricks Model Serving** for scalable inference
- **90% coverage guarantee** across all predictions

## 📋 Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Databricks workspace** with access to the model serving endpoint
- **Databricks access token** or CLI profile

## 🚀 Quick Start

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/jonathan-whiteley/food101-cv-app
cd food101-cv-app
```

2. **Install dependencies**
```bash
# Python dependencies
pip install -r requirements.txt

# Frontend dependencies
cd client && npm install
```

3. **Configure environment**
Create a `.env.local` file:
```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=your-access-token
```

4. **Start development servers**
```bash
# Start backend (from project root)
uvicorn server.app:app --reload --host 0.0.0.0 --port 8000

# Start frontend (in new terminal)
cd client && npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:5173`

### Deploy to Databricks Apps

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete Databricks Asset Bundles (DABs) deployment instructions.

## 📁 Project Structure

```
├── server/                    # FastAPI backend
│   ├── app.py                # Application entry point
│   ├── routers/              # API endpoints
│   └── services/             # Business logic & model client
│
├── client/                   # React frontend
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   └── lib/            # Utilities
│   └── package.json        # Frontend dependencies
│
├── scripts/                  # Build & deployment scripts
├── docs/                    # Documentation
│   ├── product.md          # Product requirements
│   ├── design.md           # Technical design
│   └── databricks_apis/    # API documentation
│
├── pyproject.toml           # Python dependencies
├── app.yaml                 # Databricks Apps configuration
└── README.md               # This file
```

## 🎨 UI Components

The application features a cohesive blue-to-purple gradient theme across all cards:

- **Header card** - Application title and description
- **Adaptive Prediction Sets card** - Explanation of the key innovation
- **Top Prediction card** - Displays the most likely food class
- **Prediction Set card** - Shows all possibilities ordered by confidence

## 🔧 Development

### API Endpoints

- `GET /api/user/me` - Get current Databricks user information
- `POST /api/classify` - Classify a food image
  - Accepts: `multipart/form-data` with `image` field
  - Returns: Classification results with prediction set

### Frontend Development

```bash
cd client
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Development

```bash
uvicorn server.app:app --reload  # Start with hot reload
python -m pytest                 # Run tests (if available)
```

## 📊 Model Details

- **Base Model**: google/vit-base-patch16-224-in21k (Vision Transformer)
- **Fine-tuned on**: nateraw/food101 dataset (101 food categories)
- **Evaluation Loss**: 0.6771
- **Evaluation Accuracy**: 84.53%
- **Calibration**: Conformal prediction with 90% coverage guarantee
- **Input Size**: 224x224 pixels (16x16 patch size)
- **Preprocessing**: Standard ImageNet normalization

## 🐛 Troubleshooting

### Slow Classification
The model endpoint can take a few minutes to spin up on first use. The app displays a warning after 15 seconds to inform users.

### Connection Errors
Verify your Databricks credentials in `.env.local`:
- Check `DATABRICKS_HOST` is correct
- Ensure `DATABRICKS_TOKEN` is valid and not expired
- Confirm model serving endpoint is running

### Import Errors
Make sure all dependencies are installed:
```bash
pip install -r requirements.txt
cd client && npm install
```

## 📝 License

[Add your license here]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or issues, please [open an issue](https://github.com/jonathan-whiteley/food101-cv-app/issues) on GitHub.

---

**Built with ❤️ using Databricks, FastAPI, and React**
