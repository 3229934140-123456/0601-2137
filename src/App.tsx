import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./components/Layout/MainLayout";
import { SubscriptionPage } from "./pages/Subscription";
import { DeliveryPage } from "./pages/Delivery";
import { QuotaPage } from "./pages/Quota";
import { QualityPage } from "./pages/Quality";
import { BillingPage } from "./pages/Billing";
import { MembersPage } from "./pages/Members";
import { ApprovalPage } from "./pages/Approval";

export default function App() {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Navigate to="/subscription" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
          <Route path="/quota" element={<QuotaPage />} />
          <Route path="/quality" element={<QualityPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/approval" element={<ApprovalPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
