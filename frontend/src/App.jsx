import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import DoctorLayout from "./layouts/DoctorLayout";
import UserMedicalProfile from "./pages/UserMedicalProfile";
import ServicePage from "./pages/ServicePage";
import DoctorPage from "./pages/DoctorPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DoctorDetail from "./pages/DoctorDetail";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/Homepage";
import AppointmentPage from "./pages/AppointmentPage";
import ListAppointmentPage from "./pages/ListAppointmentPage.jsx";
import ProfileManagePage from "./pages/ProfileManagePage";
import AppointmentManagePage from "./pages/AppointmentManagePage";
import MedicalLabPage from "./pages/BlogTestPage.jsx";
import TestPageDetails from "./pages/TestPageDetails.jsx";
import WorkSchedulePage from "./pages/WorkSchedulePage";
import StaffScheduleManager from "./pages/staff/StaffScheduleManager";
import Changepass from "./pages/ChangePassword";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import SendQAForm from "./pages/sendQA";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AccountManagement from "./pages/admin/AccountManagement";
import EmployeeManagement from "./pages/admin/EmployessManagement";
import StaffLayout from "./components/staff/StaffLayout";
import InvoiceUser from "./pages/InvoiceManagement";
import BlogManagement from "./pages/staff/BlogManagement";
import CategoryManagement from "./pages/staff/CategoryBlogManagement";
import ServiceManagement from "./pages/staff/ServiceManagement";
import DepartmentManagement from "./pages/staff/DepartmentManagement";
import SpecialtyManagement from "./pages/staff/SpecialtyManagement";
import InvoiceManagement from "./pages/staff/InvoiceManagement";
import PaymentView from "./pages/staff/PaymentView";
import NewsManagement from "./pages/staff/NewsManagement";
import FeedbackManagement from "./pages/staff/FeedbackManagement";
import QnAView from "./pages/staff/QnAView";
import AppointmentScheduleManagement from "./pages/staff/AppointmentScheduleManagement";
import NotificationManagement from "./pages/staff/NotificationManagement";
import UserManagement from "./pages/staff/UserManagement";
import MedicalRecord from "./pages/staff/MedicalRecord";
import MedicineManagement from "./pages/staff/MedicineManagement";
import Header from "./components/HeaderComponent";
import MenuComponent from "./components/MenuComponent";
import FooterComponent from "./components/FooterComponent";
import InvoiceList from "./components/InvoiceList";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentFail from "./components/PaymentFail";
import CreateInvoice from "./components/staff/CreateInvoice";
import NotificationCenter from "./pages/NotificationCenter";
import NotificationDetail from "./pages/NotificationDetail";
import {
  PrivateRoute,
  PrivateRouteNotAllowUser,
  PrivateRouteByRole,
} from "./components/PrivateRoute";
import "antd/dist/reset.css";
import AddMedicalRecord from "./components/AddMedicalRecord";
import ViewMedicalRecords from "./components/ViewMedicalRecord";
import CreateServicePage from "./components/staff/CreateServicePage";
import EditServicePage from "./components/staff/EditService";
import HealthCalculatorPage from "./pages/HealthCalculatorPage";
import BlogListPage from "./pages/BlogListPage";
import NewsListPage from "./pages/NewsListPage";
import NewsDetail from "./pages/NewsDetail";
import BlogDetail from "./pages/BlogDetail";
import ViewMedicalRecord from "./pages/ViewMedicalRecord";
import NotFoundPage from "./pages/NotFoundPage";
import DoctorAttendance from './components/staff/DoctorAttendance';
import StaffAttendance from './pages/staff/attendanceStaff.jsx';
import MedicineListPage from "./pages/MedicineListPage.jsx";
import MedicineDetail from "./pages/MedicineDetail";
import ServiceDetail from "./pages/ServiceDetail.jsx";
import DepartmentPage from "./pages/DepartmentListPage.jsx";
import DepartmentDetail from "./pages/DepartmentDetail.jsx";
import QAHistories from "./pages/QAHistories";
import ProfileStaff from "./pages/staff/ProfileStaff";
import ProfileDoctor from "./pages/ProfileDoctor";
// them FAQ
import FAQList from "./pages/FAQ.jsx";
import NutritionAdvice from "./pages/NutritionAdvice.jsx";
import AppointmentSuccess from "./components/AppointmentSuccess.jsx";
import MedicinePage from "./pages/MedicinePage.jsx";
import LabTestPage from "./pages/LabTestPage.jsx";
import DoctorAppointments from "./pages/DoctorAppointment.jsx";
import CreateInvoice2 from "./components/staff/CreateInvoiceTest.jsx";
import AttendanceManagement from "./pages/admin/AttendanceManagement.jsx";

const DRAWER_WIDTH = 240;

// Redirect logic based on role and current path
const RoleRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role || "patient";
    const path = location.pathname;

    if (!user) return;

    if (path === "/") {
      if (role === "Admin") navigate("/admin", { replace: true });
      else if (role === "Staff") navigate("/staff", { replace: true });
      else if (role === "Doctor") navigate("/doctor", { replace: true });
      else navigate("/home", { replace: true });
      return;
    }

    if (role === "Admin" && !path.startsWith("/admin")) {
      navigate("/admin", { replace: true });
    }
    // else if (role === "Staff" && !path.startsWith("/staff")) {
    //   navigate("/staff", { replace: true });
    // } else if (role === "Doctor" && !path.startsWith("/doctor")) {
    //   navigate("/doctor", { replace: true });
    // }
    else if (
      role === "patient" &&
      (path.startsWith("/admin") || path.startsWith("/staff"))
    ) {
      navigate("/home", { replace: true });
    }
  }, [navigate, location]);

  return null;
};

// Main routes + layout
const AppRoutes = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [role, setRole] = useState("patient");
  const [user, setUser] = useState(null);
  const location = useLocation();

  const toggleMenu = () => setMenuOpen((open) => !open);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userRole = storedUser?.role?.toLowerCase() || "patient";

    setUser(storedUser);
    setRole(userRole);
  }, [location.pathname]);

  const isPatient = role === "patient";

  return (
    <>
      {isPatient && <Header onMenuClick={toggleMenu} menuOpen={menuOpen} />}
      {isPatient && user && (
        <MenuComponent
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          role={role}
        />
      )}

      <div
        style={{
          marginTop: 84,
          marginLeft: menuOpen ? DRAWER_WIDTH : 0,
          transition: "margin-left 0.3s ease",
        }}
      >
        <RoleRedirect />

        <Routes>
          <Route path="/doctor" element={<DoctorLayout />}>
            <Route path="medical-profile" element={<UserMedicalProfile />} />
            <Route path="medicine" element={<MedicinePage />} />
            <Route
              path="appointments"
              element={<DoctorAppointments/>}
            />
            <Route
              path="notifications"
              element={<div>Notifications Page</div>}
            />
            <Route path="/doctor/attendance" element={<DoctorAttendance />} />
            <Route path="/doctor/labtest" element={<LabTestPage />} />
            <Route path="work-schedule" element={<WorkSchedulePage />} />
          </Route>

          <Route path="/" element={<HomePage />} />
          {/* Admin Layout Routes */}
          <Route
            path="/admin/*"
            element={
              <PrivateRouteByRole allowedRoles={["Admin"]}>
                <AdminLayout />
              </PrivateRouteByRole>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<AccountManagement />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="attendance" element={<AttendanceManagement />} />
          </Route>

          {/* Staff */}
          <Route
            path="/staff/*"
            element={
              <PrivateRouteByRole allowedRoles={["Staff"]}>
                <StaffLayout />
              </PrivateRouteByRole>
            }
          >
            <Route index element={<BlogManagement />} />
            <Route path="blogs" element={<BlogManagement />} />
            <Route path="category-management" element={<CategoryManagement />} />
            <Route path="invoices/create" element={<CreateInvoice2/>}></Route>
            <Route path="services" element={<ServiceManagement />} />
            <Route path="services/create" element={<CreateServicePage />} />
            <Route path="services/edit/:id" element={<EditServicePage />} />
            <Route path="departments" element={<DepartmentManagement />} />
            <Route path="specialties" element={<SpecialtyManagement />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="payments" element={<PaymentView />} />
            <Route path="news" element={<NewsManagement />} />
            <Route path="add/medicalrecords" element={<AddMedicalRecord />} />
            <Route
              path="view/medicalrecords"
              element={<ViewMedicalRecords />}
            />

            <Route path="feedback" element={<FeedbackManagement />} />
            <Route path="qna" element={<QnAView />} />
            <Route
              path="appointments"
              element={<AppointmentScheduleManagement />}
            />
            <Route path="notifications" element={<NotificationManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="medicalrecord" element={<MedicalRecord />} />
            <Route path="medicines" element={<MedicineManagement />} />
            <Route path="schedule" element={<StaffScheduleManager />} />
            <Route path="profile" element={<ProfileStaff />} />
            <Route path="attendance" element={<StaffAttendance />} /> {/* Add Staff Attendance route */}
          </Route>


          <Route path="/doctor" element={<PrivateRouteByRole allowedRoles={["Doctor"]}><DoctorLayout /></PrivateRouteByRole>}>
            <Route path="medical-profile" element={<UserMedicalProfile />} />
            <Route path="medicine" element={<div>View Medicine Page</div>} />
            <Route
              path="appointments"
              element={<div>Appointment List Page</div>}
            />
            <Route
              path="notifications"
              element={<div>Notifications Page</div>}
            />
            <Route path="work-schedule" element={<WorkSchedulePage />} />

            <Route path="profile" element={<ProfileDoctor />} />
          </Route>
          {/* Public routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/service-home" element={<ServicePage />} />
          <Route path="/doctor-home" element={<DoctorPage />} />
          <Route path="/blogs" element={<BlogListPage />} />
          <Route path="/news" element={<NewsListPage />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/news/:slug" element={<NewsDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/medicines-home" element={<MedicineListPage />} />
          <Route path="/department-home" element={<DepartmentPage />} />
          <Route path="/myprofile" element={<ProfilePage />} />
          <Route path="/invoice" element={<InvoiceUser />} />
          <Route path="/profilemanage" element={<ProfileManagePage />} />
          <Route path="/appointment" element={<AppointmentPage />} />
          <Route path="/appointmentmanage" element={<AppointmentManagePage />} />
          <Route path="/not-found" element={<NotFoundPage />} />
          <Route path="/doctor/:doctorId" element={<DoctorDetail />} />
          <Route path="/medicines/:medicineId" element={<MedicineDetail />} />
          <Route path="service/:serviceId" element={<ServiceDetail />} />
          <Route path="/department/:departmentId" element={<DepartmentDetail />} />
          <Route path="/myappointments" element={<ListAppointmentPage />} />


          {/* <Route path="/medicalrecord" element={<AddMedicalRecord />} />
          <Route path="/medicalrecords" element={<ViewMedicalRecords />} /> */}
          <Route path="/payment" element={<InvoiceList />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/fail" element={<PaymentFail />} />
          {/* <Route path="/labtests" element={<LabtestResult />} /> */}
          <Route path="/health/calculator" element={<HealthCalculatorPage />} />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/changepass" element={<Changepass />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/notifications" element={<NotificationCenter />} />
          <Route path="/notifications/:id" element={<NotificationDetail />} />
          <Route path="/health/food" element={<NutritionAdvice />} />
          <Route path="/qahistory" element={<QAHistories />} />
          <Route path="/qa" element={<SendQAForm />} />
          <Route path="/faq" element={<FAQList />} /> {/*them FAQ cho user xem*/}

          {/* Protected routes */}
          <Route
            path="/appointment"
            element={
              <PrivateRoute>
                <AppointmentPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/appointment/success"
            element={
              <PrivateRoute>
                <AppointmentSuccess />
              </PrivateRoute>
            }
          />
          <Route
            path="/medicalrecords"
            element={
              <PrivateRoute>
                <MedicalRecord />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>

      {isPatient && <FooterComponent />}
    </>
  );
};

// Root App component that wraps with <Router>
const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;