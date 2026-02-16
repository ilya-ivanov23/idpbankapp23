# IDPBank Application

A comprehensive modern banking platform built with Next.js, designed to provide users with a seamless financial management experience. This application allows users to connect multiple bank accounts, track real-time transactions, and transfer funds securely.

## 🚀 Key Features

- **Secure Authentication**: robust sign-up and sign-in functionality powered by Appwrite.
- **Financial Dashboard**: Get a holistic view of your total balance across all connected accounts, recent transactions, and spending categories.
- **Bank Integration (Plaid)**: Connect real bank accounts using Plaid API integration to fetch live balance and transaction data.
- **Transaction History**: Detailed, filterable, and searchable table of all your financial activities.
- **Funds Transfer**: Secure interface to transfer funds to other users within the platform.
- **Responsive Design**: Fully responsive interface optimized for desktop, tablet, and mobile devices.
- **Dark Mode Support**: Comprehensive dark mode implementation for comfortable viewing in low-light environments, featuring a premium dark palette.

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Icons**: Lucide React
- **Backend / Services**:
  - **Appwrite**: Authentication, Database, and backend logic.
  - **Plaid**: Banking data aggregation and integration.
  - **Sentry**: Error tracking and performance monitoring.
- **Form Handling**: React Hook Form with Zod validation.

## 📂 Project Structure

- **/app**: Next.js App Router pages and layouts.
- **/components**: Reusable UI components (Sidebar, MobileNav, BankCard, etc.).
- **/lib**: Utility functions, server actions, and Appwrite configuration.
- **/constants**: Static data and style configurations.
- **/public**: Static assets (images, icons).

## 🏃‍♂️ Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/idpbankapp23.git
    cd idpbankapp23
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and configure your Appwrite, Plaid, and Sentry keys.

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 🎨 Design & Theming

The application features a custom design system with:

- **Light Mode**: Clean, professional interface with blues and greys.
- **Dark Mode**: Sophisticated dark theme using deep slate/grey tones (inspired by Coursera's dark palette) for reduced eye strain and modern aesthetics.
- **Dynamic Components**: Interactive elements like charts, transaction tables, and form inputs that adapt seamlessly to the selected theme.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
