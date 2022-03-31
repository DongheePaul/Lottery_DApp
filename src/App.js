import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

import Web3 from "web3";
let lotteryAddress = "0x35d342d19F797ffB09B7E445e215BF908e9482E0";
let lotteryABI = [
  {
    constant: true,
    inputs: [],
    name: "answerForTest",
    outputs: [{ name: "", type: "bytes32" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "index", type: "uint256" },
      { indexed: true, name: "bettor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "challenges", type: "bytes1" },
      { indexed: false, name: "answerBlockNumber", type: "uint256" },
    ],
    name: "BET",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "index", type: "uint256" },
      { indexed: false, name: "bettor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "challenges", type: "bytes1" },
      { indexed: false, name: "answer", type: "bytes1" },
      { indexed: false, name: "answerBlockNumber", type: "uint256" },
    ],
    name: "WIN",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "index", type: "uint256" },
      { indexed: false, name: "bettor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "challenges", type: "bytes1" },
      { indexed: false, name: "answer", type: "bytes1" },
      { indexed: false, name: "answerBlockNumber", type: "uint256" },
    ],
    name: "FAIL",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "index", type: "uint256" },
      { indexed: false, name: "bettor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "challenges", type: "bytes1" },
      { indexed: false, name: "answer", type: "bytes1" },
      { indexed: false, name: "answerBlockNumber", type: "uint256" },
    ],
    name: "DRAW",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "index", type: "uint256" },
      { indexed: false, name: "bettor", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "challenges", type: "bytes1" },
      { indexed: false, name: "answerBlockNumber", type: "uint256" },
    ],
    name: "REFUND",
    type: "event",
  },
  {
    constant: true,
    inputs: [],
    name: "getPot",
    outputs: [{ name: "value", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "index", type: "uint256" }],
    name: "getBetInfo",
    outputs: [
      { name: "answerBlockNumber", type: "uint256" },
      { name: "bettor", type: "address" },
      { name: "challenges", type: "bytes1" },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "challenges", type: "bytes1" }],
    name: "bet",
    outputs: [{ name: "result", type: "bool" }],
    payable: true,
    stateMutability: "payable",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "challenges", type: "bytes1" }],
    name: "betAndDistribute",
    outputs: [{ name: "result", type: "bool" }],
    payable: true,
    stateMutability: "payable",
    type: "function",
  },
  {
    constant: false,
    inputs: [],
    name: "distribute",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "challenges", type: "bytes1" },
      { name: "answer", type: "bytes32" },
    ],
    name: "isMatch",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "pure",
    type: "function",
  },
  {
    constant: false,
    inputs: [{ name: "answer", type: "bytes32" }],
    name: "setAnswerForTest",
    outputs: [{ name: "result", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

class App extends Component {
  //리액트 실행 시 가장 먼저 시작되는 함수.
  async componentDidMount() {
    await this.initWeb3();
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

    let accounts = await this.web3.eth.getAccounts();
    this.account = accounts[0];
    //스-컨과 연동할 떄 가장 먼저 해야하는 게 스-컨 객체를 만드는 일.
    this.lotteryContract = new this.web3.eth.Contract(
      lotteryABI,
      lotteryAddress
    );
    //call() => 트랜잭션 없이, 블록체인을 변화시키지 않고 값만 읽어오는 액션. 변화 주는 액션은 invoke, send 등으로 말함.
    let pot = await this.lotteryContract.methods.getPot().call();
    console.log(pot);
    let owner = await this.lotteryContract.methods.owner().call();
    console.log(owner);
  };
  bet = async () => {
    //get nonce. nonce = 특정 주소가 만든 트랜잭션의 갯수. 트랜잭션 리플레이를 방지하고 외부 유저의 개입 방지 기능. 트랜잭션 보내기 전에 항상 nonce를 담아서 보내야함. 메타마스크가 자체적으로 이 기능 수행해줌.
    let nonce = await this.web3.eth.getTransactionCount(this.account);
    this.lotteryContract.methods
      .betAndDistribute("0xcd")
      .send({
        from: this.account,
        value: 5000000000000000,
        gas: 300000,
        nonce: nonce,
      });
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
