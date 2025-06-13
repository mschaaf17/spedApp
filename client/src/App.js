import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import Home from "./pages/Home/";
import NoMatch from "./pages/NoMatch";
import LoadingPage from "./pages/LoadingPage";

import StudentAccommodations from "./pages/StudentPages/StudentAccommodations";
import BreakTimer from "./pages/StudentPages/BreakTimer";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// teacher pages: general
import StudentList from "./pages/TeacherPages/StudentsAssignedToTeacher/StudentsTab";
import DataMeasuresList from "./pages/TeacherPages/DataMeasures/DataMeasuresTab";
import Interventions from "./pages/TeacherPages/Interventions/InterventionsTab";
import AccommodationList from "./pages/TeacherPages/Accommodations/AccommodationsTab";

// teacher pages: specific to student
import SideMenuLandingPage from "./pages/TeacherPages/SideMenuLandingPage";
import Charts from "./pages/TeacherPages/StudentCharts/Charts";
import AddAccommodationsForStudent from "./pages/TeacherPages/Accommodations/AddAccommodationsForStudent";

//student pages
import StudentProfile from "./pages/StudentPages/StudentProfile";
import StudentGraph from "./pages/StudentViewableGraphs";
import AdditionalStudentInfo from "./pages/TeacherPages/AdditionalStudentInfo";
import Dashboard from "./pages/Dashboard";

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("id_token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});
const httpLink = createHttpLink({
  uri: "/graphql",
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NoMatch />} />
          <Route path="/loading" element={<LoadingPage />} />

          {/* teacher pages: general */}
          <Route path="/studentList/:username" element={<StudentList />} />
          <Route path="/dataMeasures" element={<DataMeasuresList />} />
          <Route path="/interventions" element={<Interventions />} />
          <Route path="/accommodations" element={<AccommodationList />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* teacher pages: student specific pages */}
          <Route
            path="/studentProfile/:username/SideMenuLandingPage"
            element={<SideMenuLandingPage />}
          />
          {/* <Route path ="/studentProfile/:username/studentCharts" element ={<Charts/>}/> */}
          {/* <Route path ="/studentProfile/:username/addAccommodationsForStudent" element ={<AddAccommodationsForStudent/>}/> */}
          <Route
            path="/studentProfile/:username/studentCharts/additionalStudentInfo"
            element={<AdditionalStudentInfo />}
          />

          {/* student pages */}
          <Route
            path="/studentAccommodations"
            element={<StudentAccommodations />}
          />
          <Route path="/breakTimer" element={<BreakTimer />} />
          <Route path="/data" element={<StudentGraph />} />
          <Route
            path="/studentProfile/:username"
            element={<StudentProfile />}
          />
        </Routes>
        <Footer />
      </Router>
    </ApolloProvider>
  );
}

export default App;
