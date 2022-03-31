import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

import Web3 from "web3";

class App extends Component {
  //리액트 실행 시 가장 먼저 시작되는 함수.
  async componentDidMount() {
    await this.initWeb3();
    console.log(this.web3);
    let accounts = await this.web3.eth.getAccounts();
    console.log(accounts);
    let balance = await new this.web3.eth.getBalance(accounts[0]);
    console.log(balance);
    //   // await this.pollData();
    //   //setInterval(this.pollData, 1000);
  }
  initWeb3 = async () => {
    if (window.ethereum) {
      console.log("Recent mode");
      this.web3 = new Web3(window.ethereum);
      try {
        // Request account access if needed
        await window.ethereum.enable();
        // Acccounts now exposed
        // this.web3.eth.sendTransaction({/* ... */});
      } catch (error) {
        // User denied account access...
        console.log(`User denied account access error : ${error}`);
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      console.log("legacy mode");
      this.web3 = new Web3(Web3.currentProvider);
      // Acccounts always exposed
      // web3.eth.sendTransaction({/* ... */});
    }
    // Non-dapp browsers...
    else {
      console.log(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }

    // let accounts = await this.web3.eth.getAccounts();
    // this.account = accounts[0];

    // this.lotteryContract = new this.web3.eth.Contract(
    //   lotteryABI,
    //   lotteryAddress
    // );
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload. hihi
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
