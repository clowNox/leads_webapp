
# ☀️ Solar ROI Insights – ML & Visualization Dashboard

This project provides a complete end-to-end analysis of solar panel installations using a dataset of 50,000+ rows. It combines data visualizations and machine learning models to uncover financial and environmental insights related to solar adoption.

---

## 📌 Project Objectives

- Explore trends in solar consumption, savings, and subsidies
- Visualize solar performance metrics across key dimensions
- Train ML models to predict:
  - ROI percentage
  - Payback period
  - Monthly savings
  - High ROI classification
- Display all insights in a single clean dashboard notebook

---

## 📊 Visualizations (8 Total)

1. Distribution of Consumption vs Generation
2. Correlation Heatmap
3. ROI Distribution by Panel Type
4. Monthly Savings vs System Cost
5. Payback Period Distribution
6. Subsidy % vs ROI
7. CO₂ Saved vs Annual Output
8. ROI by Ownership & Location

---

## 🤖 ML Models Trained (4 Total)

| Model Name              | Target Variable           | Type          |
|------------------------|---------------------------|---------------|
| ROI Prediction          | `roi_%`                   | Regression    |
| Payback Period          | `payback_period_years`    | Regression    |
| Monthly Savings         | `monthly_savings_rs`      | Regression    |
| High ROI Classification | ROI ≥ 30% (binary flag)   | Classification|

Each model was evaluated using:
- RMSE & R² for regressions
- Accuracy & ROC AUC for classification

---

## 🧠 Feature Importance

We also plot feature importances for all models to identify which system attributes impact ROI and savings the most.

---

## 📂 Files Included

- `solar_dashboard_full.ipynb` – Complete notebook with visuals, models, and summary
- `solar_analysis.csv` – Cleaned dataset (assumed, not included here)
- `ml_model_summary.csv` – Optional exportable summary of model metrics
- `README.md` – This file
- `PROCESS_DOC.md` – Step-by-step breakdown of logic and decisions

---

## 🚀 Getting Started

To run this project in Google Colab:
1. Upload the dataset: `cleaned_solar_dataset.csv`
2. Open `solar_dashboard_full.ipynb`
3. Run cells sequentially
4. View visual insights and model outputs in a single notebook

---

## 👨‍🔬 Author

Amit Derwal  
_ML for Green Energy Enthusiast_  
[LinkedIn](https://www.linkedin.com) | [GitHub](https://github.com)

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
