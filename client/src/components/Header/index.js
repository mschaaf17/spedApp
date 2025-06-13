import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { QUERY_ME } from "../../utils/queries";
import "../../index.css";
import Auth from "../../utils/auth";

const Header = () => {
  const [activeLink, setActiveLink] = useState("");
  const { loading, data } = useQuery(QUERY_ME);
  const admin = data?.me ? data.me.isAdmin : false; // Check if data.me exists before accessing isAdmin
  const location = useLocation();

  useEffect(() => {
    if (data) {
      setActiveLink(location.pathname);
    }
  }, [location.pathname, data]);

  const handleLinkClick = (path, event) => {
    event.preventDefault();
    setActiveLink(path);
  };

  const logout = (event) => {
    event.preventDefault();
    Auth.logout();
  };
  if (!Auth.loggedIn()) {
    return (
      <header className="nav">
        <ul class="nav-links">
          <li class="left-item">Inclusion App Logo</li>
          <li class={`center ${activeLink === "/signup" ? "active" : ""}`}>
            <a href="/signup" onClick={(event) => handleLinkClick("/signup")}>
              Sign up
            </a>
          </li>
          <li class={`center ${activeLink === "/login" ? "active" : ""}`}>
            <a href="/login" onClick={(event) => handleLinkClick("/login")}>
              Login
            </a>
          </li>
        </ul>
      </header>
    );
  }

  if (
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/loading"
  ) {
    return null;
  }

  return (
    <header className="nav">
      {Auth.loggedIn() && admin !== true ? (
        <ul class="nav-links">
          <li>
            <a href="#">Inclusion App</a>
          </li>
          <li class="center">
            <a href="/dashboard">Dashboard</a>
          </li>
          <li class="center">
            <a href="/studentAccommodations">Accommodations</a>
          </li>
          <li class="upward">
            <a href="#">Data</a>
          </li>
          <li class="forward logout">
            <a href="/" onClick={logout}>
              Logout
            </a>
          </li>
        </ul>
      ) : Auth.loggedIn() && admin === true ? (
        <ul class="nav-links">
          <li class="left-item">Inclusion App Logo</li>
          <li class={`center ${activeLink === "/dashboard" ? "active" : ""}`}>
            <a
              href="/dashboard"
              onClick={(event) => handleLinkClick("/dashboard")}
            >
              Dashboard
            </a>
          </li>
          <li
            class={`center ${
              activeLink === "/studentList/" + data?.me.username ? "active" : ""
            }`}
          >
            <a
              href={`/studentList/${data?.me.username}`}
              onClick={(event) =>
                handleLinkClick(`/studentList/${data?.me.username}`)
              }
            >
              Students
            </a>
          </li>
          <li
            class={`center ${activeLink === "/dataMeasures" ? "active" : ""}`}
          >
            <a
              href="/dataMeasures"
              onClick={(event) => handleLinkClick("/dataMeasures")}
            >
              Data Measures
            </a>
          </li>
          <li
            class={`center ${activeLink === "/interventions" ? "active" : ""}`}
          >
            <a
              href="/interventions"
              onClick={(event) => handleLinkClick("/interventions")}
            >
              Interventions
            </a>
          </li>
          <li
            class={`center ${activeLink === "/accommodations" ? "active" : ""}`}
          >
            <a
              href="/accommodations"
              onClick={(event) => handleLinkClick("/accommodations")}
            >
              Accommodations
            </a>
          </li>
          <li className="center">
            <a
              href="/"
              onClick={logout}
              style={{ color: "rgb(125, 128, 130)", textDecoration: "none" }}
            >
              Logout
            </a>
          </li>
        </ul>
      ) : (
        <>{}</>
      )}
    </header>
  );
};

export default Header;
