# 🏦 IDPBank: Enterprise-Grade Fintech Ecosystem

[![Production](https://img.shields.io/badge/Production-Live-green?style=for-the-badge)](https://idpbank.app)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2014%20%7C%20GCP%20%7C%20Appwrite-blue?style=for-the-badge)](https://idpbank.app)
[![Monitoring](https://img.shields.io/badge/Monitoring-Grafana%20%26%20Loki-orange?style=for-the-badge)](https://idpbank.app)

**IDPBank** is a comprehensive banking platform combining real-world account aggregation, transaction management, and intelligent analytics. Built as a response to "Super-App fatigue," it offers a minimalist interface backed by a robust, cloud-native infrastructure deployed to modern security standards.

🌐 **Live Demo:** [idpbank.app](https://idpbank.app)

---

## 📸 Interface & UX
*A seamless, distraction-free financial management experience.*

| <img width="1901" height="1204" alt="Снимок экрана 2026-04-09 в 22 47 57" src="https://github.com/user-attachments/assets/3f754a3a-a9d3-4c31-a86f-f60770756fb7" />|
|:--:|
| *Central Dashboard: Real-time balance aggregation, activity charts, and recent transactions.* |

| <img width="1901" height="1204" alt="Снимок экрана 2026-04-09 в 22 48 54" src="https://github.com/user-attachments/assets/af8283bb-c810-4360-8145-c9307610446c" />| 
|:--:|
| *Plaid Integration: Securely connect to 10,000+ banks.* |

| <img width="433" height="933" alt="Снимок экрана 2026-04-09 в 22 49 49" src="https://github.com/user-attachments/assets/52bf2b31-47dc-42ad-b9bd-f1e5d8d6eda0" />|
|:--:|
| *Mobile-First Design: Fully responsive across all devices.* |

---

## 🏗 Technological Architecture (Current Production Stack)

The project is built on a microservices-oriented logic and cloud infrastructure, ensuring high availability and secure data flow.

### **Frontend & Core**
* **Framework:** Next.js 14 (App Router) — Maximum performance, SSR, and SEO.
* **Language:** TypeScript — Strict typing for all financial operations.
* **Styling:** Tailwind CSS + Shadcn UI — Premium visual language with Dark Mode.
* **State & Forms:** React Hook Form + Zod — Bulletproof data validation.

### **Backend & Storage**
* **BaaS:** Appwrite — Secure user authentication and core database management.
* **Banking API:** Plaid SDK — Synchronization with the real-world banking sector.
* **Storage:** S3-compatible storage (Cloudflare) for secure static assets.

### **DevOps & Cloud**
* **Cloud Hosting:** Google Cloud Platform (GCP).
* **Reverse Proxy:** **Caddy** (Production) for automated SSL & Subdomain Routing / **Nginx** (Local).
* **Edge Network:** **Cloudflare** (WAF, CDN, DNS) — DDoS protection and global edge delivery.
* **Containerization:** Docker & Docker Compose for service isolation.

---

## 📊 Observability & Monitoring
*Engineering without data is guessing. We monitor every event in the system.*

The platform is equipped with a full observability stack, allowing proactive detection of server anomalies before they impact the user:
* **Grafana:** Deep visualization of system performance metrics.
* **Loki:** Centralized log aggregation across all Docker containers.
* **Sentry:** Real-time client-side and server-side error tracking.

| <img width="1690" height="842" alt="Снимок экрана 2026-04-12 в 19 34 26" src="https://github.com/user-attachments/assets/13e65161-97ce-4cf2-9d1f-9640dcf7f12c" />|
|:--:|
| *System Health Dashboard: Request logging, CPU load, and error analytics.* |

---

## 🔥 Key Features

- ✅ **Multi-Bank Linking:** Aggregate multiple bank accounts into a single financial profile.
- ✅ **Real-Time Transactions:** Instant updates of financial history via webhooks.
- ✅ **Money Transfers:** Secure internal P2P transfer system.
- ✅ **Category Analytics:** Automatic distribution of expenses by categories.
- ✅ **Enterprise Security:** Multi-Factor Authentication (MFA) and data encryption at rest.

---

## 🗺️ Architectural Roadmap (Evolution to Polyglot Microservices)

To handle massive scale and complex transactions, the system is currently evolving into an **Event-Driven Enterprise Architecture**:

```mermaid
graph TD
    %% Styling
    classDef frontend fill:#000,stroke:#333,stroke-width:2px,color:#fff
    classDef gcp fill:#e3f2fd,stroke:#1e88e5,stroke-width:2px,color:#000
    classDef azure fill:#e0f7fa,stroke:#00acc1,stroke-width:2px,color:#000
    classDef database fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px,color:#000

    %% Frontend Layer
    UI[🖥️ Next.js 14 UI<br/>Vercel Edge]:::frontend

    %% GCP Core Banking Layer
    subgraph GCP [☁️ Google Cloud Platform: Core Engine]
        API[Node.js API Gateway<br/>JWT Validation]:::gcp
        Kafka{Apache Kafka<br/>Event Bus}:::gcp
        Java[☕ Java Spring Boot<br/>Transaction Engine]:::gcp
        DB[(PostgreSQL<br/>ACID Ledger)]:::database
    end

    %% Azure AI Layer
    subgraph Azure [☁️ Azure: Isolated AI Environment]
        Gemma[🧠 Gemma 4 LLM<br/>Dockerized]:::azure
    end

    %% Flows
    UI -->|HTTPS Request| API
    API -->|Produce: TransactionEvent| Kafka
    Kafka -->|Consume: Async Processing| Java
    Java -->|Read/Write Ledger| DB
    Java -->|Saga Pattern: RollbackEvent| Kafka
    
    %% AI Flow
    API -.->|Fetch Private Insights| Gemma
