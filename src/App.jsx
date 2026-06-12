import { useEffect, useState } from "react";

const bloodGroups = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const emptyForms = {
  donor: {
    name: "",
    bloodGroup: "O-",
    city: "",
    phone: "",
    lastDonation: new Date().toISOString().split("T")[0]
  },
  inventory: {
    bloodGroup: "O-",
    units: "",
    location: "",
    updatedAt: new Date().toISOString().split("T")[0]
  },
  request: {
    patient: "",
    bloodGroup: "O-",
    unitsNeeded: "",
    hospital: "",
    city: "",
    priority: "Critical"
  }
};

export default function App() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState("");
  const [forms, setForms] = useState(emptyForms);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/dashboard");
      if (!response.ok) {
        throw new Error("Failed to load dashboard data.");
      }
      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(section, field, value) {
    setForms((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value
      }
    }));
  }

  async function submitForm(section, endpoint, payloadBuilder) {
    try {
      setSubmitting(section);
      setError("");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBuilder())
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Request failed.");
      }

      await loadDashboard();
      setForms((current) => ({
        ...current,
        [section]: {
          ...emptyForms[section]
        }
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting("");
    }
  }

  const stats = dashboard?.stats || { donors: 0, totalUnits: 0, activeRequests: 0 };
  const inventory = dashboard?.inventory || [];
  const donors = dashboard?.donors || [];
  const requests = dashboard?.requests || [];
  const lowStockCount = inventory.filter((item) => item.statusTone === "low" || item.statusTone === "critical").length;
  const availableDonorCount = donors.filter((donor) => donor.statusTone === "ok").length;
  const groupSummary = bloodGroups.map((group) => {
    const match = inventory.find((item) => item.bloodGroup === group);
    return {
      group,
      units: match?.units || 0,
      tone: match?.statusTone || "empty"
    };
  });

  return (
    <div className="page-shell">
      <nav className="topbar" aria-label="Application">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">B</span>
          <p className="brand-kicker">BloodNet Ops</p>
          <strong>Emergency Blood Control</strong>
        </div>
        <div className="topbar-actions">
          <span className={`system-pill ${error ? "offline" : "online"}`}>
            {error ? "Backend offline" : "System online"}
          </span>
          <button className="ghost-button" type="button" onClick={loadDashboard} disabled={loading}>
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Emergency Response Dashboard</p>
          <h1>Emergency Blood Donation & Availability System</h1>
          <p className="hero-text">
            One operational view for hospitals, blood banks, and response teams to track
            compatible donors, stock levels, and active emergency requests.
          </p>
          <div className="hero-stats">
            <article>
              <p>Registered donors</p>
              <span>{stats.donors}</span>
              <small>{availableDonorCount} available now</small>
            </article>
            <article>
              <p>Units in stock</p>
              <span>{stats.totalUnits}</span>
              <small>{lowStockCount} groups need review</small>
            </article>
            <article>
              <p>Active emergencies</p>
              <span>{stats.activeRequests}</span>
              <small>{requests.length} open request records</small>
            </article>
          </div>
        </div>
        <aside className="hero-card" aria-label="Operational readiness">
          <div>
            <p className="card-label">Readiness brief</p>
            <h2>Prioritize shortage risk before it becomes critical.</h2>
          </div>
          <div className="availability-board" aria-label="Blood group availability">
            {groupSummary.map((item) => (
              <div className={`blood-chip ${item.tone}`} key={item.group}>
                <strong>{item.group}</strong>
                <span>{item.units}u</span>
              </div>
            ))}
          </div>
          <ul className="readiness-list">
            <li>Low stock is surfaced by blood group</li>
            <li>Requests stay paired with donor matches</li>
            <li>Records are optimized for shift handover</li>
          </ul>
        </aside>
      </header>

      {error ? <div className="flash flash-error">{error}</div> : null}
      {loading ? <div className="flash">Loading dashboard...</div> : null}

      <main className="dashboard">
        <section className="panel form-panel">
          <div className="panel-heading">
            <p className="panel-kicker">Add donor</p>
            <h2>Donor Registry</h2>
          </div>
          <form
            className="data-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitForm("donor", "/api/donors", () => forms.donor);
            }}
          >
            <label>
              Full name
              <input
                value={forms.donor.name}
                onChange={(event) => handleChange("donor", "name", event.target.value)}
                placeholder="Aisha Khan"
                required
              />
            </label>
            <label>
              Blood group
              <select
                value={forms.donor.bloodGroup}
                onChange={(event) => handleChange("donor", "bloodGroup", event.target.value)}
              >
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <label>
              City
              <input
                value={forms.donor.city}
                onChange={(event) => handleChange("donor", "city", event.target.value)}
                placeholder="Kolkata"
                required
              />
            </label>
            <label>
              Phone
              <input
                value={forms.donor.phone}
                onChange={(event) => handleChange("donor", "phone", event.target.value)}
                placeholder="+91 98XXXXXX12"
                required
              />
            </label>
            <label>
              Last donated on
              <input
                type="date"
                value={forms.donor.lastDonation}
                onChange={(event) => handleChange("donor", "lastDonation", event.target.value)}
                required
              />
            </label>
            <button disabled={submitting === "donor"} type="submit">
              {submitting === "donor" ? "Saving..." : "Register donor"}
            </button>
          </form>
        </section>

        <section className="panel form-panel">
          <div className="panel-heading">
            <p className="panel-kicker">Update stock</p>
            <h2>Blood Inventory</h2>
          </div>
          <form
            className="data-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitForm("inventory", "/api/inventory", () => ({
                ...forms.inventory,
                units: Number(forms.inventory.units)
              }));
            }}
          >
            <label>
              Blood group
              <select
                value={forms.inventory.bloodGroup}
                onChange={(event) => handleChange("inventory", "bloodGroup", event.target.value)}
              >
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Units available
              <input
                type="number"
                min="0"
                value={forms.inventory.units}
                onChange={(event) => handleChange("inventory", "units", event.target.value)}
                placeholder="12"
                required
              />
            </label>
            <label>
              Storage location
              <input
                value={forms.inventory.location}
                onChange={(event) => handleChange("inventory", "location", event.target.value)}
                placeholder="City Blood Bank"
                required
              />
            </label>
            <label>
              Last updated
              <input
                type="date"
                value={forms.inventory.updatedAt}
                onChange={(event) => handleChange("inventory", "updatedAt", event.target.value)}
                required
              />
            </label>
            <button disabled={submitting === "inventory"} type="submit">
              {submitting === "inventory" ? "Saving..." : "Save inventory"}
            </button>
          </form>
        </section>

        <section className="panel form-panel accent-panel">
          <div className="panel-heading">
            <p className="panel-kicker">Emergency intake</p>
            <h2>Raise Urgent Request</h2>
          </div>
          <form
            className="data-form"
            onSubmit={(event) => {
              event.preventDefault();
              submitForm("request", "/api/requests", () => ({
                ...forms.request,
                unitsNeeded: Number(forms.request.unitsNeeded)
              }));
            }}
          >
            <label>
              Patient / case ID
              <input
                value={forms.request.patient}
                onChange={(event) => handleChange("request", "patient", event.target.value)}
                placeholder="Case-ER-204"
                required
              />
            </label>
            <label>
              Required blood group
              <select
                value={forms.request.bloodGroup}
                onChange={(event) => handleChange("request", "bloodGroup", event.target.value)}
              >
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Units needed
              <input
                type="number"
                min="1"
                value={forms.request.unitsNeeded}
                onChange={(event) => handleChange("request", "unitsNeeded", event.target.value)}
                placeholder="3"
                required
              />
            </label>
            <label>
              Hospital
              <input
                value={forms.request.hospital}
                onChange={(event) => handleChange("request", "hospital", event.target.value)}
                placeholder="Apollo Emergency Wing"
                required
              />
            </label>
            <label>
              City
              <input
                value={forms.request.city}
                onChange={(event) => handleChange("request", "city", event.target.value)}
                placeholder="Kolkata"
                required
              />
            </label>
            <label>
              Priority
              <select
                value={forms.request.priority}
                onChange={(event) => handleChange("request", "priority", event.target.value)}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
              </select>
            </label>
            <button disabled={submitting === "request"} type="submit">
              {submitting === "request" ? "Saving..." : "Create emergency request"}
            </button>
          </form>
        </section>

        <section className="panel wide-panel">
          <div className="panel-heading split">
            <div>
              <p className="panel-kicker">Live status</p>
              <h2>Inventory Overview</h2>
            </div>
            <p className="panel-note">Low stock is highlighted for immediate replenishment.</p>
          </div>
          <div className="card-grid">
            {inventory.length ? (
              inventory.map((item) => (
                <article
                  className={`inventory-card ${item.statusTone}`}
                  key={item.id}
                  style={{ "--stock-level": `${Math.min(Number(item.units) || 0, 20) * 5}%` }}
                >
                  <div className="inventory-card__top">
                    <h3>{item.bloodGroup}</h3>
                    <span className={`badge ${item.statusTone}`}>{item.statusLabel}</span>
                  </div>
                  <p className="inventory-units">
                    {item.units} unit{item.units === 1 ? "" : "s"}
                  </p>
                  <p className="inventory-location">{item.location}</p>
                  <p className="inventory-date">Updated {item.updatedAtFormatted}</p>
                  <div className="stock-meter" aria-hidden="true">
                    <span />
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No inventory records yet.</div>
            )}
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-heading split">
            <div>
              <p className="panel-kicker">People ready to help</p>
              <h2>Donor Availability</h2>
            </div>
            <p className="panel-note">Eligibility is calculated automatically from donation history.</p>
          </div>
          <div className="table-like">
            {donors.length ? (
              donors.map((donor) => (
                <article className="donor-row" key={donor.id}>
                  <div>
                    <h3 className="donor-name">{donor.name}</h3>
                    <p className="donor-meta">{donor.bloodGroup} donor</p>
                  </div>
                  <div>
                    <p className="donor-city">{donor.city}</p>
                    <p className="donor-phone">{donor.phone}</p>
                  </div>
                  <div className="donor-status-wrap">
                    <span className={`badge ${donor.statusTone}`}>{donor.statusLabel}</span>
                    <p className="donor-date">{donor.eligibilityText}</p>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No donors registered yet.</div>
            )}
          </div>
        </section>

        <section className="panel wide-panel">
          <div className="panel-heading split">
            <div>
              <p className="panel-kicker">Current emergencies</p>
              <h2>Request Matching Center</h2>
            </div>
            <p className="panel-note">Each request includes stock coverage and top donor matches.</p>
          </div>
          <div className="request-stack">
            {requests.length ? (
              requests.map((request) => (
                <article className="request-card" key={request.id}>
                  <div className="request-card__header">
                    <div>
                      <p className="request-priority">{request.priority}</p>
                      <h3>{request.patient}</h3>
                    </div>
                    <span className={`badge ${request.priorityTone}`}>
                      {request.bloodGroup} - {request.unitsNeeded} unit{request.unitsNeeded === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="request-meta">
                    {request.hospital}, {request.city} - Raised {request.createdAtFormatted}
                  </p>
                  <div className="request-split">
                    <div>
                      <h4>Inventory support</h4>
                      <p>{request.inventoryCoverageText}</p>
                    </div>
                    <div>
                      <h4>Top donor matches</h4>
                      {request.matches.length ? (
                        <ul className="match-list">
                          {request.matches.map((match) => (
                            <li key={match.id}>
                              {match.name} ({match.bloodGroup}) - {match.city} - {match.phone}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No eligible compatible donors available right now.</p>
                      )}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No emergency requests have been created.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
