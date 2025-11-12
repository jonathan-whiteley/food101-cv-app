# 🚀 Deployment Guide

This guide covers deploying the Food 101 Conformal Classifier locally and on Databricks Apps using Databricks Asset Bundles (DABs).

## 📋 Table of Contents

- [Local Development](#-local-development)
- [Databricks Apps Deployment](#-databricks-apps-deployment)
- [Databricks Asset Bundles (DABs)](#-databricks-asset-bundles-dabs)
- [Environment Configuration](#-environment-configuration)
- [Troubleshooting](#-troubleshooting)

---

## 💻 Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- Databricks workspace with model serving endpoint
- Databricks personal access token

### Step 1: Clone the Repository

```bash
git clone https://github.com/jonathan-whiteley/food101-cv-app
cd food101-cv-app
```

### Step 2: Install Python Dependencies

```bash
# Create a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### Step 4: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Databricks Configuration
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=dapi1234567890abcdef

# Model Serving Endpoint (if different from default)
# MODEL_ENDPOINT_NAME=food101-conformal-classifier
```

To get your Databricks token:
1. Go to your Databricks workspace
2. Click on your username in the top right
3. Select **User Settings**
4. Go to **Access Tokens**
5. Click **Generate New Token**

### Step 5: Start the Backend Server

```bash
# From project root
uvicorn server.app:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **Application**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.json

### Step 6: Start the Frontend Development Server

In a new terminal:

```bash
cd client
npm run dev
```

The frontend will be available at:
- **Application**: http://localhost:5173

### Step 7: Access the Application

Open your browser and navigate to `http://localhost:5173`

### Development Workflow

#### Hot Reloading
Both servers support hot reloading:
- **Backend**: FastAPI auto-reloads on Python file changes
- **Frontend**: Vite auto-reloads on TypeScript/React changes

#### Code Formatting
```bash
# Format Python code
black server/
isort server/

# Format TypeScript code
cd client
npm run format
```

#### Testing the API
Use the FastAPI docs at `http://localhost:8000/docs` to test endpoints interactively.

---

## ☁️ Databricks Apps Deployment

Databricks Apps allows you to deploy full-stack applications directly in your Databricks workspace.

### Prerequisites

- Databricks workspace (Premium or Enterprise tier recommended)
- Databricks CLI installed and configured
- Appropriate permissions to create apps in the workspace

### Step 1: Install Databricks CLI

```bash
# On macOS
brew tap databricks/tap
brew install databricks

# On Linux/Windows, use pip
pip install databricks-cli
```

### Step 2: Configure Databricks CLI

```bash
databricks auth login --host https://your-workspace.cloud.databricks.com
```

This will open a browser window for authentication.

Alternatively, use a personal access token:

```bash
databricks configure --token
```

### Step 3: Build the Frontend

```bash
cd client
npm run build
cd ..
```

This creates an optimized production build in `client/build/`.

### Step 4: Configure app.yaml

Update the `app.yaml` file with your workspace configuration:

```yaml
# app.yaml
resources:
  apps:
    food101-cv-app:
      name: food101-cv-app
      description: "Food 101 Conformal Prediction Classifier"

      # Your workspace path
      # Replace with your username/workspace path
      source_code_path: /Workspace/Users/your.email@company.com/food101-cv-app

      # Environment variables
      config:
        env:
          - name: DATABRICKS_HOST
            value: "{{workspace.host}}"
          - name: DATABRICKS_TOKEN
            value: "{{secrets.token}}"
```

### Step 5: Create the App (First Time Only)

```bash
databricks apps create food101-cv-app
```

### Step 6: Deploy the App

```bash
# Deploy using Databricks CLI
databricks apps deploy food101-cv-app \
  --source-code-path /Workspace/Users/your.email@company.com/food101-cv-app
```

### Step 7: Access Your Deployed App

After deployment completes, get your app URL:

```bash
databricks apps list | grep food101-cv-app
```

Your app will be available at:
`https://your-workspace.cloud.databricks.com/apps/food101-cv-app`

---

## 📦 Databricks Asset Bundles (DABs)

Databricks Asset Bundles provide a comprehensive way to deploy and manage Databricks resources, including apps, jobs, and pipelines.

### What are DABs?

DABs allow you to:
- Define all resources in YAML configuration files
- Version control your infrastructure
- Deploy consistently across environments (dev, staging, prod)
- Manage dependencies between resources

### Project Structure for DABs

```
food101-cv-app/
├── databricks.yml          # Main DABs configuration
├── resources/
│   ├── apps.yml           # App resource definitions
│   └── jobs.yml           # Job definitions (if needed)
├── src/
│   ├── server/            # Python backend
│   └── client/            # React frontend
└── environments/
    ├── dev.yml            # Development environment config
    ├── staging.yml        # Staging environment config
    └── prod.yml           # Production environment config
```

### Step 1: Initialize DABs

Create a `databricks.yml` file in your project root:

```yaml
# databricks.yml
bundle:
  name: food101-cv-app

include:
  - resources/*.yml

workspace:
  host: https://your-workspace.cloud.databricks.com

environments:
  dev:
    default: true
    workspace:
      host: https://dev-workspace.cloud.databricks.com
      root_path: /Workspace/Users/dev@company.com/.bundle/food101-cv-app/dev

  prod:
    workspace:
      host: https://prod-workspace.cloud.databricks.com
      root_path: /Workspace/Users/prod@company.com/.bundle/food101-cv-app/prod
```

### Step 2: Define App Resources

Create `resources/apps.yml`:

```yaml
# resources/apps.yml
resources:
  apps:
    food101-cv-app:
      name: food101-cv-app-${bundle.environment}
      description: "Food 101 Conformal Classifier - ${bundle.environment}"

      source_code_path: ${workspace.file_path}/app

      config:
        env:
          - name: ENVIRONMENT
            value: ${bundle.environment}
          - name: DATABRICKS_HOST
            value: ${workspace.host}
```

### Step 3: Validate Your Bundle

```bash
# Validate the DABs configuration
databricks bundle validate

# See what will be deployed
databricks bundle validate --environment dev
```

### Step 4: Deploy with DABs

```bash
# Deploy to development environment
databricks bundle deploy --environment dev

# Deploy to production environment
databricks bundle deploy --environment prod
```

### Step 5: Run and Monitor

```bash
# Get deployment status
databricks bundle run --environment dev

# View app logs
databricks apps logs food101-cv-app-dev
```

### DABs Best Practices

1. **Use environment variables** for configuration differences
2. **Version control** all YAML files
3. **Test in dev** before promoting to production
4. **Use secrets** for sensitive values (tokens, API keys)
5. **Document** environment-specific requirements

### Example: Multi-Environment Setup

```yaml
# environments/dev.yml
bundle:
  name: food101-cv-app-dev

resources:
  apps:
    food101-cv-app:
      config:
        env:
          - name: MODEL_ENDPOINT
            value: "food101-model-dev"
```

```yaml
# environments/prod.yml
bundle:
  name: food101-cv-app-prod

resources:
  apps:
    food101-cv-app:
      config:
        env:
          - name: MODEL_ENDPOINT
            value: "food101-model-prod"
          - name: LOG_LEVEL
            value: "INFO"
```

Deploy to specific environments:

```bash
# Deploy to dev
databricks bundle deploy -e dev

# Deploy to prod
databricks bundle deploy -e prod
```

---

## 🔧 Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABRICKS_HOST` | Your Databricks workspace URL | `https://workspace.cloud.databricks.com` |
| `DATABRICKS_TOKEN` | Personal access token | `dapi1234567890abcdef` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MODEL_ENDPOINT_NAME` | Model serving endpoint name | `food101-conformal-classifier` |
| `LOG_LEVEL` | Application log level | `INFO` |
| `MAX_UPLOAD_SIZE` | Maximum image upload size (MB) | `10` |

### Using Environment Variables

#### Local Development
Create `.env.local`:
```bash
DATABRICKS_HOST=https://your-workspace.cloud.databricks.com
DATABRICKS_TOKEN=your-token
MODEL_ENDPOINT_NAME=food101-model
```

#### Databricks Apps
Configure in `app.yaml`:
```yaml
config:
  env:
    - name: DATABRICKS_HOST
      value: "{{workspace.host}}"
    - name: DATABRICKS_TOKEN
      value: "{{secrets.token}}"
```

---

## 🐛 Troubleshooting

### Local Development Issues

#### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

#### Module Not Found Errors
```bash
# Reinstall Python dependencies
pip install -r requirements.txt --force-reinstall

# Reinstall frontend dependencies
cd client && rm -rf node_modules && npm install
```

#### CORS Errors
Ensure your backend is running on `http://localhost:8000` and frontend on `http://localhost:5173`. The Vite config should proxy API requests automatically.

### Databricks Apps Issues

#### Authentication Failures
```bash
# Reconfigure Databricks CLI
databricks auth login --host https://your-workspace.cloud.databricks.com

# Test authentication
databricks current-user me
```

#### Deployment Failures
```bash
# Check app status
databricks apps get food101-cv-app

# View app logs
databricks apps logs food101-cv-app --follow

# Redeploy
databricks apps deploy food101-cv-app --force
```

#### App Not Starting
1. Check that all dependencies are in `requirements.txt`
2. Verify `app.yaml` configuration is correct
3. Ensure model serving endpoint is running
4. Check app logs for Python errors

### DABs Issues

#### Validation Errors
```bash
# Validate bundle configuration
databricks bundle validate

# Check for syntax errors in YAML files
yamllint databricks.yml resources/*.yml
```

#### Deployment Fails
```bash
# Check workspace permissions
databricks workspace whoami

# Verify resource paths
databricks bundle validate --debug

# Force redeploy
databricks bundle deploy --force
```

### Model Endpoint Issues

#### Endpoint Not Responding
1. Check endpoint status in Databricks workspace
2. Verify endpoint name matches configuration
3. Ensure endpoint is in "Ready" state
4. Check endpoint logs for errors

#### Slow Predictions
Model serving endpoints can take 2-3 minutes to spin up when idle. The app displays a warning message after 15 seconds to inform users.

### Getting Help

- **GitHub Issues**: [Report a bug](https://github.com/jonathan-whiteley/food101-cv-app/issues)
- **Databricks Documentation**: [Databricks Apps Guide](https://docs.databricks.com/apps/)
- **DABs Documentation**: [Asset Bundles Guide](https://docs.databricks.com/dev-tools/bundles/)

---

## 📚 Additional Resources

- [Databricks Apps Documentation](https://docs.databricks.com/apps/)
- [Databricks Asset Bundles](https://docs.databricks.com/dev-tools/bundles/)
- [Databricks CLI Reference](https://docs.databricks.com/dev-tools/cli/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

---

**Need help?** Open an issue on [GitHub](https://github.com/jonathan-whiteley/food101-cv-app/issues)
