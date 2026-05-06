import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, "data.json");
const donationGapDays = 90;
const lowStockThreshold = 5;
const bloodGroups = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

const compatibilityMap = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": bloodGroups
};

export async function getDashboardData() {
  const state = await readState();

  const inventory = [...state.inventory]
    .sort((a, b) => a.units - b.units)
    .map((item) => {
      const status = getInventoryStatus(item.units);
      return {
        ...item,
        statusLabel: status.label,
        statusTone: status.tone,
        updatedAtFormatted: formatDate(item.updatedAt)
      };
    });

  const donors = [...state.donors]
    .sort((a, b) => getEligibilityRank(a) - getEligibilityRank(b))
    .map((donor) => {
      const eligibility = getDonorEligibility(donor.lastDonation);
      return {
        ...donor,
        statusLabel: eligibility.label,
        statusTone: eligibility.tone,
        eligibilityText: eligibility.detail
      };
    });

  const priorityOrder = { Critical: 0, High: 1, Moderate: 2 };
  const requests = [...state.requests]
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .map((request) => ({
      ...request,
      createdAtFormatted: formatDateTime(request.createdAt),
      priorityTone: getPriorityTone(request.priority),
      inventoryCoverageText: getInventoryCoverageText(request, state.inventory),
      matches: getTopDonorMatches(request, state.donors)
    }));

  return {
    stats: {
      donors: state.donors.length,
      totalUnits: state.inventory.reduce((sum, item) => sum + item.units, 0),
      activeRequests: state.requests.length
    },
    donors,
    inventory,
    requests
  };
}

export async function addDonor(payload) {
  validatePayload(payload, ["name", "bloodGroup", "city", "phone", "lastDonation"]);
  assertBloodGroup(payload.bloodGroup);

  const state = await readState();
  const donor = {
    id: randomUUID(),
    name: payload.name.trim(),
    bloodGroup: payload.bloodGroup,
    city: payload.city.trim(),
    phone: payload.phone.trim(),
    lastDonation: payload.lastDonation
  };

  state.donors.unshift(donor);
  await writeState(state);
  return donor;
}

export async function upsertInventory(payload) {
  validatePayload(payload, ["bloodGroup", "units", "location", "updatedAt"]);
  assertBloodGroup(payload.bloodGroup);

  if (!Number.isInteger(payload.units) || payload.units < 0) {
    throw new Error("Units must be a non-negative whole number.");
  }

  const state = await readState();
  const existing = state.inventory.find((item) => item.bloodGroup === payload.bloodGroup);
  const record = {
    id: existing?.id || randomUUID(),
    bloodGroup: payload.bloodGroup,
    units: payload.units,
    location: payload.location.trim(),
    updatedAt: payload.updatedAt
  };

  if (existing) {
    Object.assign(existing, record);
  } else {
    state.inventory.push(record);
  }

  await writeState(state);
  return record;
}

export async function addRequest(payload) {
  validatePayload(payload, ["patient", "bloodGroup", "unitsNeeded", "hospital", "city", "priority"]);
  assertBloodGroup(payload.bloodGroup);

  if (!Number.isInteger(payload.unitsNeeded) || payload.unitsNeeded <= 0) {
    throw new Error("Units needed must be a whole number greater than zero.");
  }

  const allowedPriorities = new Set(["Critical", "High", "Moderate"]);
  if (!allowedPriorities.has(payload.priority)) {
    throw new Error("Priority must be Critical, High, or Moderate.");
  }

  const state = await readState();
  const request = {
    id: randomUUID(),
    patient: payload.patient.trim(),
    bloodGroup: payload.bloodGroup,
    unitsNeeded: payload.unitsNeeded,
    hospital: payload.hospital.trim(),
    city: payload.city.trim(),
    priority: payload.priority,
    createdAt: new Date().toISOString()
  };

  state.requests.unshift(request);
  await writeState(state);
  return request;
}

async function readState() {
  try {
    const raw = await fs.readFile(dataFilePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeState(seedData());
      return seedData();
    }
    throw error;
  }
}

async function writeState(state) {
  await fs.writeFile(dataFilePath, JSON.stringify(state, null, 2));
}

function seedData() {
  return {
    donors: [
      {
        id: randomUUID(),
        name: "Aisha Khan",
        bloodGroup: "O-",
        city: "Kolkata",
        phone: "+91 9876543210",
        lastDonation: daysAgo(120)
      },
      {
        id: randomUUID(),
        name: "Rohan Sen",
        bloodGroup: "A+",
        city: "Howrah",
        phone: "+91 9812345678",
        lastDonation: daysAgo(35)
      },
      {
        id: randomUUID(),
        name: "Priya Das",
        bloodGroup: "B+",
        city: "Kolkata",
        phone: "+91 9900011122",
        lastDonation: daysAgo(140)
      },
      {
        id: randomUUID(),
        name: "Naved Ali",
        bloodGroup: "AB-",
        city: "Durgapur",
        phone: "+91 9845012376",
        lastDonation: daysAgo(96)
      }
    ],
    inventory: [
      {
        id: randomUUID(),
        bloodGroup: "O-",
        units: 4,
        location: "City Blood Bank",
        updatedAt: daysAgo(1)
      },
      {
        id: randomUUID(),
        bloodGroup: "A+",
        units: 11,
        location: "Medicare Central Lab",
        updatedAt: daysAgo(2)
      },
      {
        id: randomUUID(),
        bloodGroup: "B+",
        units: 7,
        location: "LifeLine Hospital Storage",
        updatedAt: daysAgo(0)
      },
      {
        id: randomUUID(),
        bloodGroup: "AB-",
        units: 2,
        location: "City Blood Bank",
        updatedAt: daysAgo(0)
      }
    ],
    requests: [
      {
        id: randomUUID(),
        patient: "Case-ER-204",
        bloodGroup: "AB+",
        unitsNeeded: 3,
        hospital: "Apollo Emergency Wing",
        city: "Kolkata",
        priority: "Critical",
        createdAt: new Date().toISOString()
      }
    ]
  };
}

function validatePayload(payload, fields) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Request body is required.");
  }

  for (const field of fields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      throw new Error(`${field} is required.`);
    }
  }
}

function assertBloodGroup(group) {
  if (!bloodGroups.includes(group)) {
    throw new Error("Invalid blood group.");
  }
}

function getInventoryCoverageText(request, inventory) {
  const compatibleUnits = inventory
    .filter((item) => compatibilityMap[request.bloodGroup].includes(item.bloodGroup))
    .reduce((sum, item) => sum + item.units, 0);

  if (compatibleUnits >= request.unitsNeeded) {
    return `${compatibleUnits} compatible units available. This request can be covered from existing stock.`;
  }

  if (compatibleUnits > 0) {
    const remaining = request.unitsNeeded - compatibleUnits;
    return `${compatibleUnits} compatible units available. Additional donor outreach is needed for the remaining ${remaining} unit${remaining === 1 ? "" : "s"}.`;
  }

  return "No compatible stock available. Immediate donor mobilization required.";
}

function getTopDonorMatches(request, donors) {
  return donors
    .filter((donor) => compatibilityMap[request.bloodGroup].includes(donor.bloodGroup))
    .filter((donor) => getDonorEligibility(donor.lastDonation).eligible)
    .sort((a, b) => {
      const cityWeight =
        Number(b.city.toLowerCase() === request.city.toLowerCase()) -
        Number(a.city.toLowerCase() === request.city.toLowerCase());
      if (cityWeight !== 0) {
        return cityWeight;
      }
      return new Date(a.lastDonation) - new Date(b.lastDonation);
    })
    .slice(0, 4);
}

function getDonorEligibility(lastDonation) {
  const donatedAt = new Date(lastDonation);
  const nextEligible = new Date(donatedAt);
  nextEligible.setDate(nextEligible.getDate() + donationGapDays);
  const eligible = nextEligible <= new Date();

  return {
    eligible,
    label: eligible ? "Eligible" : "Recovery",
    tone: eligible ? "ok" : "low",
    detail: eligible ? `Ready since ${formatDate(nextEligible)}` : `Eligible on ${formatDate(nextEligible)}`
  };
}

function getEligibilityRank(donor) {
  return getDonorEligibility(donor.lastDonation).eligible ? 0 : 1;
}

function getInventoryStatus(units) {
  if (units === 0) {
    return { label: "Out", tone: "critical" };
  }
  if (units <= lowStockThreshold) {
    return { label: "Low stock", tone: "low" };
  }
  return { label: "Healthy", tone: "ok" };
}

function getPriorityTone(priority) {
  if (priority === "Critical") {
    return "critical";
  }
  if (priority === "High") {
    return "low";
  }
  return "ok";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}
