import "./App.css";
import { useEffect, useState, useCallback } from "react";
import AuthPage from "./AuthPage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [stats, setStats] = useState({
    total_transactions: 0,
    blocked: 0,
    needs_verification: 0,
    allowed: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [chartType, setChartType] = useState("donut");
  const [decisionFilter, setDecisionFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [tokenExpiresIn, setTokenExpiresIn] = useState(null);
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      String(transaction.sender)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(transaction.receiver)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesDecision =
      decisionFilter === "ALL" ||
      String(transaction.decision).toUpperCase() === decisionFilter;

    return matchesSearch && matchesDecision;
  });

  // Sorting transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortBy) {
      case "amount_high":
        return Number(b.amount) - Number(a.amount);

      case "amount_low":
        return Number(a.amount) - Number(b.amount);

      case "risk_high":
        return Number(b.risk_score) - Number(a.risk_score);

      case "risk_low":
        return Number(a.risk_score) - Number(b.risk_score);

      case "oldest":
        return new Date(a.created_at) - new Date(b.created_at);

      case "newest":
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedTransactions.length / recordsPerPage);

  const startIndex = (currentPage - 1) * recordsPerPage;

  const currentTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + recordsPerPage,
  );

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      "Transaction ID",
      "Sender",
      "Receiver",
      "Amount",
      "Location",
      "Risk Score",
      "Decision",
      "Risk Indicators",
      "ML Prediction",
      "ML Fraud Probability",
      "Date & Time",
    ];

    const escapeCSV = (value) => {
      let text = String(value ?? "");

      // Protect spreadsheet users from formula injection.
      if (/^[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredTransactions.map((t) => [
      t.id,
      t.sender,
      t.receiver,
      t.amount,
      t.location,
      t.risk_score,
      t.decision,
      Array.isArray(t.reasons) ? t.reasons.join("; ") : "",
      t.ml_prediction || "N/A",
      t.ml_fraud_probability ?? "N/A",
      t.created_at || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "FinSecure_Transactions.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  //  Export to PDF
  const handleExportPDF = () => {
    if (filteredTransactions.length === 0) return;

    const doc = new jsPDF({
      orientation: "landscape",
    });

    // Report title
    doc.setFontSize(20);
    doc.text("FinSecure - Fraud Detection Report", 14, 18);

    // Report information
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 27);
    doc.text(`Account: ${authEmail}`, 14, 33);

    // Transaction summary
    const total = filteredTransactions.length;
    const allowed = filteredTransactions.filter(
      (t) => t.decision === "ALLOW",
    ).length;
    const verify = filteredTransactions.filter(
      (t) => t.decision === "VERIFY",
    ).length;
    const blocked = filteredTransactions.filter(
      (t) => t.decision === "BLOCK",
    ).length;
    const fraudulent = filteredTransactions.filter(
      (t) => t.ml_prediction === "FRAUDULENT",
    ).length;

    doc.setFontSize(12);
    doc.text("Transaction Summary", 14, 43);

    doc.setFontSize(10);
    doc.text(
      `Total: ${total}    ALLOW: ${allowed}    VERIFY: ${verify}    BLOCK: ${blocked}    ML Fraudulent: ${fraudulent}`,
      14,
      50,
    );

    // Transaction table
    autoTable(doc, {
      startY: 58,
      head: [
        [
          "ID",
          "Sender",
          "Receiver",
          "Amount",
          "Location",
          "Risk",
          "Decision",
          "ML Prediction",
          "ML Probability",
          "Date & Time",
        ],
      ],
      body: filteredTransactions.map((t) => [
        t.id,
        t.sender,
        t.receiver,
        `Rs. ${t.amount}`,
        t.location,
        `${t.risk_score}/100`,
        t.decision,
        t.ml_prediction || "N/A",
        t.ml_fraud_probability != null ? `${t.ml_fraud_probability}%` : "N/A",
        t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "N/A",
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [20, 184, 166],
      },
    });

    // Download PDF
    doc.save("FinSecure_Fraud_Report.pdf");
  };

  // Authentication handling

  function handleLogin(token, email, expiresIn) {
    setAuthToken(token);
    setAuthEmail(email);
    setTokenExpiresIn(expiresIn);
    setIsAuthenticated(true);
  }

  const handleLogout = useCallback(() => {
    setAuthToken(null);
    setAuthEmail("");
    setTokenExpiresIn(null);
    setIsAuthenticated(false);
    setTransactions([]);
    setAnalysis(null);
    setSelectedTransaction(null);

    setStats({
      total_transactions: 0,
      blocked: 0,
      needs_verification: 0,
      allowed: 0,
    });
  }, []);

  const chartData = [
    {
      name: "ALLOW",
      value: transactions.filter((t) => t.decision === "ALLOW").length,
    },
    {
      name: "VERIFY",
      value: transactions.filter((t) => t.decision === "VERIFY").length,
    },
    {
      name: "BLOCK",
      value: transactions.filter((t) => t.decision === "BLOCK").length,
    },
  ];

  const chartColors = ["#14b8a6", "#f59e0b", "#ef4444"];
  const highRiskCount = chartData[2].value;

  const highRiskPercentage =
    transactions.length > 0
      ? Math.round((highRiskCount / transactions.length) * 100)
      : 0;

  const [error, setError] = useState("");

  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [location, setLocation] = useState("");

  const [transactionType, setTransactionType] = useState("TRANSFER");
  const [oldbalanceOrg, setOldbalanceOrg] = useState("");
  const [newbalanceOrig, setNewbalanceOrig] = useState("");
  const [oldbalanceDest, setOldbalanceDest] = useState("");
  const [newbalanceDest, setNewbalanceDest] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function analyzeTransaction(event) {
    event.preventDefault();
    setError("");

    // Validate sender, receiver and location
    if (!sender.trim() || !receiver.trim() || !location.trim()) {
      setError("Sender, receiver and location cannot be empty.");
      return;
    }

    // Validate transaction amount
    const transactionAmount = Number(amount);

    if (!Number.isFinite(transactionAmount) || transactionAmount <= 0) {
      setError("Transaction amount must be greater than zero.");
      return;
    }

    // Validate account balances
    const balances = [
      oldbalanceOrg,
      newbalanceOrig,
      oldbalanceDest,
      newbalanceDest,
    ];

    if (
      balances.some(
        (balance) =>
          balance.trim() === "" ||
          !Number.isFinite(Number(balance)) ||
          Number(balance) < 0,
      )
    ) {
      setError("All account balances must be valid non-negative numbers.");
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    try {
      console.log("FinSecure Frontend Input:", {
        sender,
        receiver,
        amount: Number(amount),
        location,
        type: transactionType,
        oldbalanceOrg: Number(oldbalanceOrg),
        newbalanceOrig: Number(newbalanceOrig),
        oldbalanceDest: Number(oldbalanceDest),
        newbalanceDest: Number(newbalanceDest),
      });
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },

        body: JSON.stringify({
          sender,
          receiver,
          amount: Number(amount),
          location,
          type: transactionType,
          oldbalanceOrg: Number(oldbalanceOrg),
          newbalanceOrig: Number(newbalanceOrig),
          oldbalanceDest: Number(oldbalanceDest),
          newbalanceDest: Number(newbalanceDest),
        }),
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        let errorMessage = "Transaction analysis failed.";

        if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((item) => item.msg).join(", ");
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      setAnalysis(result);
      await loadDashboard();
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Unable to connect to FinSecure server. Please check whether the backend is running.",
        );
      } else {
        setError(err.message || "Could not analyze the transaction.");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  const loadDashboard = useCallback(async () => {
    try {
      const [statsResponse, transactionsResponse] = await Promise.all([
        fetch("http://127.0.0.1:8000/statistics", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
        fetch("http://127.0.0.1:8000/transactions", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }),
      ]);

      if (statsResponse.status === 401 || transactionsResponse.status === 401) {
        handleLogout();
        return;
      }

      if (!statsResponse.ok || !transactionsResponse.ok) {
        throw new Error("Could not load dashboard data.");
      }

      const statsData = await statsResponse.json();
      const transactionsData = await transactionsResponse.json();

      setStats(statsData);
      setTransactions(transactionsData.transactions || []);
      setError("");
    } catch {
      setError(
        "Cannot connect to FinSecure backend. Check that FastAPI is running.",
      );
    }
  }, [authToken, handleLogout]);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      loadDashboard();
    }
  }, [isAuthenticated, authToken, loadDashboard]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, decisionFilter]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedTransaction(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !authToken || !tokenExpiresIn) {
      return;
    }

    const timer = window.setTimeout(() => {
      handleLogout();
    }, tokenExpiresIn * 1000);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, authToken, tokenExpiresIn, handleLogout]);

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🛡️ FinSecure</h2>
        <p className="sidebar-subtitle">Financial Security Platform</p>

        <div className="nav-item active">▦ Dashboard</div>
        <div className="nav-item">↗ Transactions</div>
        <div className="nav-item">⚠ Fraud Detection</div>
        <div className="nav-item">⚙ Settings</div>

        <div className="sidebar-footer">
          <div>● Database Records</div>
          <div className="download-dropdown">
            <button
              className="download-main-button"
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={filteredTransactions.length === 0}
            >
              <span>↓ Download Reports</span>
              <span>⌄</span>
            </button>

            {showDownloadMenu && (
              <div className="download-menu">
                <button
                  onClick={() => {
                    handleExportCSV();
                    setShowDownloadMenu(false);
                  }}
                >
                  📊 Download as CSV
                </button>

                <button
                  onClick={() => {
                    handleExportPDF();
                    setShowDownloadMenu(false);
                  }}
                >
                  📄 Download as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Security Dashboard</h1>
            <p>Monitor transactions and identify suspicious activity.</p>
          </div>
          <button onClick={loadDashboard}>↻ Refresh Data</button>
          <button onClick={handleLogout}>Logout</button>
        </header>

        {error && <div className="error-message">{error}</div>}

        <section className="panel analyzer-panel">
          <h2>Analyze a Transaction</h2>
          <p>Enter transaction details to assess potential risk.</p>

          <form onSubmit={analyzeTransaction} className="transaction-form">
            <label>
              Sender
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                required
                placeholder="e.g. User123"
              />
            </label>

            <label>
              Receiver
              <input
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                required
                placeholder="e.g. User456"
              />
            </label>

            <label>
              Amount (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="e.g. 75000"
              />
            </label>

            <label>
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                placeholder="e.g. Delhi"
              />
            </label>

            <label>
              Transaction Type
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                required
              >
                <option value="TRANSFER">TRANSFER</option>
                <option value="CASH_OUT">CASH_OUT</option>
                <option value="CASH_IN">CASH_IN</option>
                <option value="PAYMENT">PAYMENT</option>
                <option value="DEBIT">DEBIT</option>
              </select>
            </label>

            <label>
              Sender's Old Balance (₹)
              <input
                type="number"
                min="0"
                value={oldbalanceOrg}
                onChange={(e) => setOldbalanceOrg(e.target.value)}
                required
                placeholder="e.g. 50000"
              />
            </label>

            <label>
              Sender's New Balance (₹)
              <input
                type="number"
                min="0"
                value={newbalanceOrig}
                onChange={(e) => setNewbalanceOrig(e.target.value)}
                required
                placeholder="e.g. 30000"
              />
            </label>

            <label>
              Receiver's Old Balance (₹)
              <input
                type="number"
                min="0"
                value={oldbalanceDest}
                onChange={(e) => setOldbalanceDest(e.target.value)}
                required
                placeholder="e.g. 10000"
              />
            </label>

            <label>
              Receiver's New Balance (₹)
              <input
                type="number"
                min="0"
                value={newbalanceDest}
                onChange={(e) => setNewbalanceDest(e.target.value)}
                required
                placeholder="e.g. 30000"
              />
            </label>

            <button type="submit" disabled={analyzing}>
              {analyzing ? "Analyzing..." : "Analyze Transaction"}
            </button>
          </form>

          {analysis && (
            <div className="analysis-result">
              <h3>FinSecure Analysis Result</h3>

              <div className="rule-result">
                <h4>Rule-Based Detection</h4>

                <p>
                  Risk Score: <strong>{analysis.risk_score}/100</strong>
                </p>

                <p>
                  Decision: <strong>{analysis.decision}</strong>
                </p>

                <p>
                  Risk Indicators:{" "}
                  {Array.isArray(analysis.reasons) && analysis.reasons.length
                    ? analysis.reasons.join(", ")
                    : "No risk indicators detected."}
                </p>
              </div>

              <div className="ml-result">
                <h4>Machine Learning Detection</h4>

                <p>
                  ML Prediction: <strong>{analysis.ml_prediction}</strong>
                </p>

                <p>
                  ML Fraud Probability:{" "}
                  <strong>{analysis.ml_fraud_probability}%</strong>
                </p>

                <div className="probability-bar-container">
                  <div className="probability-bar-header">
                    <span>Fraud Probability</span>
                    <strong>{analysis.ml_fraud_probability}%</strong>
                  </div>

                  <div className="probability-bar-background">
                    <div
                      className="probability-bar-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            Number(analysis.ml_fraud_probability) || 0,
                            0,
                          ),
                          100,
                        )}%`,
                        backgroundColor:
                          analysis.ml_prediction === "FRAUDULENT"
                            ? "#ef4444"
                            : "#14b8a6",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="stats-gridz">
          <StatCard
            title="Total Transactions"
            value={stats.total_transactions}
            icon="▤"
          />
          <StatCard title="Blocked" value={stats.blocked} icon="⊘" />
          <StatCard
            title="Needs Verification"
            value={stats.needs_verification}
            icon="⚠"
          />
          <StatCard title="Allowed" value={stats.allowed} icon="✓" />
        </section>
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Transaction Risk Analysis</h2>
              <p>Distribution of transaction decisions</p>
            </div>
          </div>

          <div className="chart-selector">
            <button
              className={chartType === "donut" ? "active" : ""}
              onClick={() => setChartType("donut")}
            >
              Donut
            </button>

            <button
              className={chartType === "pie" ? "active" : ""}
              onClick={() => setChartType("pie")}
            >
              Pie
            </button>

            <button
              className={chartType === "bar" ? "active" : ""}
              onClick={() => setChartType("bar")}
            >
              Bar
            </button>

            <button
              className={chartType === "line" ? "active" : ""}
              onClick={() => setChartType("line")}
            >
              Line
            </button>
          </div>

          <div className="chart-content">
            {chartType === "donut" && (
              <div
                className="risk-pie-chart"
                style={{
                  background: `conic-gradient(
        #14b8a6 0% ${(chartData[0].value / Math.max(transactions.length, 1)) * 100}%,
        #f59e0b ${(chartData[0].value / Math.max(transactions.length, 1)) * 100}% ${((chartData[0].value + chartData[1].value) / Math.max(transactions.length, 1)) * 100}%,
        #ef4444 ${((chartData[0].value + chartData[1].value) / Math.max(transactions.length, 1)) * 100}% 100%
      )`,
                }}
              >
                <div className="chart-center">
                  <strong>{transactions.length}</strong>
                  <span>Total Transactions</span>
                </div>
              </div>
            )}

            {chartType === "pie" && (
              <div
                className="risk-pie-chart pie-chart"
                style={{
                  background: `conic-gradient(
        #14b8a6 0% ${(chartData[0].value / Math.max(transactions.length, 1)) * 100}%,
        #f59e0b ${(chartData[0].value / Math.max(transactions.length, 1)) * 100}% ${((chartData[0].value + chartData[1].value) / Math.max(transactions.length, 1)) * 100}%,
        #ef4444 ${((chartData[0].value + chartData[1].value) / Math.max(transactions.length, 1)) * 100}% 100%
      )`,
                }}
              />
            )}

            {chartType === "bar" && (
              <div className="bar-chart">
                {chartData.map((item, index) => (
                  <div className="bar-item" key={item.name}>
                    <span>{item.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${transactions.length ? (item.value / transactions.length) * 100 : 0}%`,
                          backgroundColor: chartColors[index],
                        }}
                      />
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            )}

            {chartType === "line" && (
              <div className="line-chart">
                <svg viewBox="0 0 360 220" className="line-chart-svg">
                  <polyline
                    points={chartData
                      .map(
                        (item, index) =>
                          `${50 + index * 130},${180 - (item.value / Math.max(...chartData.map((d) => d.value), 1)) * 140}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartData.map((item, index) => (
                    <g key={item.name}>
                      <circle
                        cx={50 + index * 130}
                        cy={
                          180 -
                          (item.value /
                            Math.max(...chartData.map((d) => d.value), 1)) *
                            140
                        }
                        r="6"
                        fill={chartColors[index]}
                      />
                      <text
                        x={50 + index * 130}
                        y="210"
                        fill="#cbd5e1"
                        fontSize="12"
                        textAnchor="middle"
                      >
                        {item.name}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}

            <div className="chart-legend">
              {chartData.map((item, index) => (
                <div className="legend-item" key={item.name}>
                  <span
                    className="legend-color"
                    style={{ backgroundColor: chartColors[index] }}
                  ></span>
                  <span>
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel high-risk-panel">
          <div className="panel-heading">
            <div>
              <h2>High-Risk Transactions</h2>
              <p>Percentage of transactions marked BLOCK</p>
            </div>
          </div>

          <div className="high-risk-content">
            <h2>{highRiskPercentage}%</h2>
            <p>
              {highRiskCount} out of {transactions.length} transactions
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Transactions</h2>
              <div className="transaction-filters">
                <input
                  type="text"
                  placeholder="Search by sender or receiver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                  value={decisionFilter}
                  onChange={(e) => setDecisionFilter(e.target.value)}
                >
                  <option value="ALL">All Decisions</option>
                  <option value="ALLOW">ALLOW</option>
                  <option value="VERIFY">VERIFY</option>
                  <option value="BLOCK">BLOCK</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount_high">Amount: High to Low</option>
                  <option value="amount_low">Amount: Low to High</option>
                  <option value="risk_high">Risk: High to Low</option>
                  <option value="risk_low">Risk: Low to High</option>
                </select>

                <button
                  className="clear-filters-btn"
                  onClick={() => {
                    setSearchTerm("");
                    setDecisionFilter("ALL");
                    setSortBy("newest");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </button>
              </div>
              <p className="filter-results-count">
                Showing {filteredTransactions.length === 0 ? 0 : startIndex + 1}
                -{" "}
                {Math.min(
                  startIndex + recordsPerPage,
                  filteredTransactions.length,
                )}{" "}
                of {filteredTransactions.length} matching transactions
              </p>

              <p>Latest transactions analyzed by FinSecure</p>
            </div>
            <span className="live-label">● Database records</span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Decision</th>
                  <th>ML Prediction</th>
                  <th>ML Probability</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state">
                      No transactions found. Analyze a transaction in API Docs
                      first.
                    </td>
                  </tr>
                ) : (
                  currentTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      onClick={() => setSelectedTransaction(transaction)}
                      className="clickable-row"
                    >
                      <td>#{transaction.id}</td>
                      <td>{transaction.sender}</td>
                      <td>{transaction.receiver}</td>

                      <td>
                        ₹{Number(transaction.amount).toLocaleString("en-IN")}
                      </td>
                      {/* Risk Score */}
                      <td>
                        <span
                          className={`risk-score ${
                            transaction.risk_score >= 70
                              ? "high-risk"
                              : transaction.risk_score >= 40
                                ? "medium-risk"
                                : "low-risk"
                          }`}
                        >
                          {transaction.risk_score}/100
                        </span>
                      </td>
                      {/* Decision */}
                      <td>
                        <span
                          className={`decision ${String(transaction.decision).toLowerCase()}`}
                        >
                          {transaction.decision}
                        </span>
                      </td>

                      {/* ML Prediction */}
                      <td>
                        <span
                          className={`decision ${String(
                            transaction.ml_prediction || "",
                          ).toLowerCase()}`}
                        >
                          {transaction.ml_prediction || "N/A"}
                        </span>
                      </td>

                      {/* ML Fraud Probability */}
                      <td>
                        {transaction.ml_fraud_probability != null
                          ? `${transaction.ml_fraud_probability}%`
                          : "N/A"}
                      </td>

                      {/* Date & Time */}
                      <td>
                        {transaction.created_at
                          ? new Date(transaction.created_at).toLocaleString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )
                          : "N/A"}
                      </td>
                      <td>
                        <button
                          className="view-details-btn"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
              >
                <select
                  value={recordsPerPage}
                  onChange={(e) => {
                    setRecordsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
                ← Previous
              </button>

              <span>
                Page {currentPage} of {Math.max(totalPages, 1)}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages}
              >
                Next →
              </button>
            </div>
          </div>

          {selectedTransaction && (
            <div
              className="modal-overlay"
              onClick={() => setSelectedTransaction(null)}
            >
              <div
                className="transaction-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-close"
                  onClick={() => setSelectedTransaction(null)}
                >
                  ×
                </button>

                <h2>Transaction Details</h2>

                <div className="transaction-detail-grid">
                  <p>
                    <strong>Transaction ID:</strong> {selectedTransaction.id}
                  </p>
                  <p>
                    <strong>Sender:</strong> {selectedTransaction.sender}
                  </p>
                  <p>
                    <strong>Receiver:</strong> {selectedTransaction.receiver}
                  </p>
                  <p>
                    <strong>Amount:</strong> ₹{selectedTransaction.amount}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedTransaction.location}
                  </p>
                  <p>
                    <strong>Date:</strong> {selectedTransaction.created_at}
                  </p>
                  <p>
                    <strong>Rule-Based Risk:</strong>{" "}
                    {selectedTransaction.risk_score}/100
                  </p>
                  <p>
                    <strong>Decision:</strong> {selectedTransaction.decision}
                  </p>
                  <p>
                    <strong>ML Prediction:</strong>{" "}
                    {selectedTransaction.ml_prediction || "N/A"}
                  </p>
                  <p>
                    <strong>ML Fraud Probability:</strong>{" "}
                    {selectedTransaction.ml_fraud_probability != null
                      ? `${selectedTransaction.ml_fraud_probability}%`
                      : "N/A"}
                  </p>
                </div>

                <h3>Risk Indicators</h3>
                {selectedTransaction.reasons?.length > 0 ? (
                  <ul>
                    {selectedTransaction.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No risk indicators detected.</p>
                )}
              </div>
            </div>
          )}
        </section>

        {selectedTransaction && (
          <section className="panel transaction-details">
            <div className="details-header">
              <h2>Transaction Details</h2>

              <button onClick={() => setSelectedTransaction(null)}>
                Close
              </button>
            </div>

            <p>
              <strong>ML Prediction:</strong>{" "}
              {selectedTransaction.ml_prediction || "N/A"}
            </p>

            <p>
              <strong>ML Fraud Probability:</strong>{" "}
              {selectedTransaction.ml_fraud_probability != null
                ? `${selectedTransaction.ml_fraud_probability}%`
                : "N/A"}
            </p>

            <p>
              <strong>Transaction ID:</strong> #{selectedTransaction.id}
            </p>

            <p>
              <strong>Sender:</strong> {selectedTransaction.sender}
            </p>

            <p>
              <strong>Receiver:</strong> {selectedTransaction.receiver}
            </p>

            <p>
              <strong>Amount:</strong> ₹
              {Number(selectedTransaction.amount).toLocaleString("en-IN")}
            </p>

            <p>
              <strong>Risk Score:</strong> {selectedTransaction.risk_score}/100
            </p>

            <p>
              <strong>Decision:</strong> {selectedTransaction.decision}
            </p>

            <p>
              <strong>Risk Indicators:</strong>
            </p>

            <ul>
              {Array.isArray(selectedTransaction.reasons) &&
              selectedTransaction.reasons.length > 0 ? (
                selectedTransaction.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))
              ) : (
                <li>No risk indicators recorded.</li>
              )}
            </ul>
          </section>
        )}

        <footer>
          FinSecure · Academic Project · AI-assisted risk analysis
        </footer>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

export default App;
