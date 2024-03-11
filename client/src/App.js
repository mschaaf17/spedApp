import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

import Home from './pages/Home/'
import StudentAccommodations  from './pages/StudentPages/StudentAccommodations';
import BreakTimer from './pages/StudentPages/BreakTimer'
import Header from './components/Header'
import Footer from './components/Footer'
import Login from './pages/Login'
import Signup from './pages/Signup'
import StudentGraph from './pages/StudentViewableGraphs'
import TeacherDataTracking from './pages/TeacherPages/TeacherDataTracking'
import StudentProfile from './pages/StudentPages/StudentProfile'
import DataLogging from './pages/TeacherPages/DataLogging'
import StudentCharts from './pages/TeacherPages/StudentCharts'
import TeacherAddAccommodations from './pages/TeacherPages/TeacherAddAccommodations/teacherAddAccom'
import AdditionalStudentInfo from './pages/TeacherPages/AdditionalStudentInfo'
import AddStudent from './pages/TeacherPages/AddStudent'
import NoMatch from './pages/NoMatch';
import LoadingPage from './pages/LoadingPage'
import Interventions from './pages/TeacherPages/Interventions'


const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('id_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});
const httpLink = createHttpLink({
  uri: '/graphql',
})

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});


function App() {
  return (
    <ApolloProvider client = {client}>
      <Router>
        <Header />
        <Routes>
          <Route path ="/" element = {<Home/>} />
          <Route path ="/login" element = {<Login/>} />
          <Route path ="/signup" element = {<Signup/>} />
          <Route path ="/studentAccommodations" element = {<StudentAccommodations/>} />
          <Route path ="/breakTimer" element ={<BreakTimer/>} />
          <Route path ="/data" element = {<StudentGraph/>}/>
          <Route path = "/teacherdata/:username" element = {<TeacherDataTracking/>}/>
          <Route path ="/studentProfile/:username" element={<StudentProfile/>}/>
          <Route path ="/studentProfile/:username/addAccommodations" element ={<TeacherAddAccommodations/>}/>
            {/* <Route path =":username" element ={<StudentProfile/>}/>
            <Route path ="" element={<StudentProfile />} /> */}
            {/* <Route path ="dataLogging" element={<DataLogging/>}/> */}

            {/* </Route> */}
            <Route path ="/studentProfile/:username/dataLogging"element ={<DataLogging/>}/>
            {/* <Route path = "/studentProfile/:username" element ={<DataLogging/>} /> */}
            {/* <Route path =":username" element ={<DataLogging />}/> */}
            {/* <Route path ="dataLogging" element={<DataLogging/>}/> */}
            {/* </Route>  */}
         
          <Route path ="/studentProfile/:username/studentCharts" element ={<StudentCharts/>}/>
          <Route path ="/studentProfile/:username/studentCharts/additionalStudentInfo" element ={<AdditionalStudentInfo/>}/>
          <Route path ="/addstudent/:username" element = {<AddStudent/>}/>
          <Route path="*" element={<NoMatch />} />
          <Route path="/loading" element={<LoadingPage/>} />
          <Route path="/interventions" element={<Interventions/>} />
        </Routes>
        <Footer />
      </Router>
    </ApolloProvider>
  );
}

export default App;
