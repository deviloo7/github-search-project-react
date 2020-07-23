import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";
const GithubContext = React.createContext();
const GithubProvider = ({ children }) => {
  const [githubUser, setgithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [isLoading, setisLoading] = useState(false);
  //https://api.github.com/users/john-smilga/repos?per_page=100
  //https://api.github.com/users/john-smilga/followers
  const [error, setError] = useState({ show: false, msg: "" });
  const searchGithubUser = async (user) => {
    toggleError();
    setisLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setgithubUser(response.data);
      const { login, followers_url } = response.data;
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ])
        .then((results) => {
          const [repos, followers] = results;
          const status = "fulfilled";
          if (repos.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleError(true, "there is no user with that username");
    }
    chaeckRequests();
    setisLoading(false);
  };
  const chaeckRequests = () => {
    axios(`${rootUrl}/rate_limit`).then(({ data }) => {
      let {
        rate: { remaining },
      } = data;
      setRequests(remaining);
      if (remaining === 0) {
        toggleError(true, "Sorry you have exceeded your hourly ate limit");
      }
    });
  };
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  useEffect(chaeckRequests, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
