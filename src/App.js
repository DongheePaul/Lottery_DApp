import React, { Component } from "react";
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
  constructor(props) {
    super(props);

    this.state = {
      betRecords: [],
      winRecords: [],
      failRecords: [],
      pot: "0",
      challenges: ["A", "B"],
      finalRecords: [
        {
          bettor: "0xab...",
          index: "0",
          challanges: "ab",
          answer: "ab",
          targetBlockNumber: "0",
          pot: "0",
        },
      ],
    };
  }
  //리액트 실행 시 가장 먼저 시작되는 함수.
  async componentDidMount() {
    await this.initWeb3();
    await this.pollData();
    setInterval(this.pollData, 3000);
  }

  pollData = async () => {
    await this.getPot();
    await this.getBetEvents();
    await this.getWinEvents();
    await this.getFailEvents();
    this.makeFinalRecords();
  };

  initWeb3 = async () => {
    if (window.ethereum) {
      console.log("Recent mode");
      this.web3 = new Web3(window.ethereum);
      try {
        // Request account access if needed
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.log(`User denied account access error : ${error}`);
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      console.log("legacy mode");
      this.web3 = new Web3(Web3.currentProvider);
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
    console.log("in bet function");
    let challanges =
      "0x" +
      this.state.challenges[0].toLowerCase() +
      this.state.challenges[1].toLowerCase();
    //get nonce. nonce = 특정 주소가 만든 트랜잭션의 갯수. 트랜잭션 리플레이를 방지하고 외부 유저의 개입 방지 기능. 트랜잭션 보내기 전에 항상 nonce를 담아서 보내야함. 메타마스크가 자체적으로 이 기능 수행해줌.
    let nonce = await this.web3.eth.getTransactionCount(this.account);
    this.lotteryContract.methods
      .betAndDistribute(challanges)
      .send({
        from: this.account,
        value: 5000000000000000,
        gas: 300000,
        nonce: nonce,
      })
      .on("transactionHash", (hash) => {
        console.log("this is hash from callback from blockchain");
        console.log(hash);
        console.log("this is hash from callback from blockchain end");
      });
  };
  getPot = async () => {
    let pot = await this.lotteryContract.methods.getPot().call();
    let potString = this.web3.utils.fromWei(pot.toString(), "ether");
    this.setState({ pot: potString });
  };
  getBetEvents = async () => {
    const records = [];
    let events = await this.lotteryContract.getPastEvents("BET", {
      fromBlock: 0,
      toBlock: "latest",
    });

    for (let i = 0; i < events.length; i++) {
      const record = {};
      record.index = parseInt(events[i].returnValues.index, 10).toString();
      record.bettor =
        events[i].returnValues.bettor.slice(0, 4) +
        "..." +
        events[i].returnValues.bettor.slice(40, 42);
      record.betBlockNumber = events[i].blockNumber;
      record.targetBlockNumber =
        events[i].returnValues.answerBlockNumber.toString();
      record.challenges = events[i].returnValues.challenges;
      record.win = "Not Revealed";
      record.answer = "0x00";
      records.unshift(record);
    }
    this.setState({ betRecords: records });
  };

  getWinEvents = async () => {
    const records = [];
    let events = await this.lotteryContract.getPastEvents("WIN", {
      fromBlock: 0,
      toBlock: "latest",
    });

    for (let i = 0; i < events.length; i += 1) {
      const record = {};
      record.index = parseInt(events[i].returnValues.index, 10).toString();
      record.amount = parseInt(events[i].returnValues.amount, 10).toString();
      records.unshift(record);
    }
    this.setState({ winRecords: records });
    console.log("this is win event =====");
    console.log(records);
  };

  getFailEvents = async () => {
    const records = [];
    let events = await this.lotteryContract.getPastEvents("FAIL", {
      fromBlock: 0,
      toBlock: "latest",
    });

    for (let i = 0; i < events.length; i += 1) {
      const record = {};
      record.index = parseInt(events[i].returnValues.index, 10).toString();
      record.answer = events[i].returnValues.answer;
      records.unshift(record);
    }
    console.log("this is fail event =====");

    console.log(records);
    this.setState({ failRecords: records });
  };

  makeFinalRecords = () => {
    let f = 0,
      w = 0;
    const records = [...this.state.betRecords];
    for (let i = 0; i < this.state.betRecords.length; i += 1) {
      if (
        this.state.winRecords.length > 0 &&
        this.state.betRecords[i].index === this.state.winRecords[w].index
      ) {
        records[i].win = "WIN";
        records[i].answer = records[i].challenges;
        records[i].pot = this.web3.utils.fromWei(
          this.state.winRecords[w].amount,
          "ether"
        );
        if (this.state.winRecords.length - 1 > w) w++;
      } else if (
        this.state.winRecords.length > 0 &&
        this.state.betRecords[i].index === this.state.failRecords[f].index
      ) {
        records[i].win = "FAIL";
        records[i].answer = this.state.failRecords[f].answer;
        records[i].pot = 0;
        if (this.state.failRecords.length - 1 > f) f++;
      } else {
        records[i].answer = "Not Revealed";
      }
    }
    this.setState({ finalRecords: records });
  };

  onClickCard = (_Character) => {
    this.setState({
      challenges: [this.state.challenges[1], _Character],
    });
  };

  getCard = (_Character, _cardStyle) => {
    let _card = "";
    if (_Character === "A") {
      _card = "🂡";
    }
    if (_Character === "B") {
      _card = "🂱";
    }
    if (_Character === "C") {
      _card = "🃁";
    }
    if (_Character === "0") {
      _card = "🃑";
    }

    return (
      <button
        className={_cardStyle}
        onClick={() => {
          this.onClickCard(_Character);
        }}
      >
        <div className="card-body text-center">
          <p className="card-text"></p>
          <p className="card-text text-center" style={{ fontSize: 300 }}>
            {_card}
          </p>
          <p className="card-text"></p>
        </div>
      </button>
    );
  };
  render() {
    return (
      <div className="App">
        {/**Header - POt, Betting characters */}
        <div className="container">
          <div className="jumbotron">
            <h1>Current pot : {this.state.pot}</h1>
            <p>Lottery </p>

            <p>Lottery tutorial</p>
            <p>Your Bet</p>
            <p>
              {this.state.challenges[0]} {this.state.challenges[1]}
            </p>
          </div>
        </div>

        {/* Card section */}
        <div className="container">
          <div className="card-group">
            {this.getCard("A", "card bg-primary")}
            {this.getCard("B", "card bg-warning")}
            {this.getCard("C", "card bg-danger")}
            {this.getCard("0", "card bg-success")}
          </div>
        </div>
        <br></br>
        <div className="container">
          <button className="btn btn-danger btn-lg" onClick={this.bet}>
            BET!
          </button>
        </div>
        <br></br>

        <div className="container">
          <table className="table table-dark table-striped">
            <thead>
              <tr>
                <th>Index</th>
                <th>Address</th>
                <th>Challenge</th>
                <th>Answer</th>
                <th>Pot</th>
                <th>Status</th>
                <th>AnswerBlockNumber</th>
              </tr>
            </thead>
            <tbody>
              {this.state.finalRecords.map((record, index) => {
                return (
                  <tr key={index}>
                    <td>{record.index}</td>
                    <td>{record.bettor}</td>
                    <td>{record.challenges}</td>
                    <td>{record.answer}</td>
                    <td>{record.pot}</td>
                    <td>{record.win}</td>
                    <td>{record.targetBlockNumber}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}

export default App;
