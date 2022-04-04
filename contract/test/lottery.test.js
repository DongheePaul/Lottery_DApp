const Lottery = artifacts.require("Lottery");
const { assert } = require("chai");
const assertRevert = require("./assertRevert");
const expectEvent = require("./expectEvent");
contract("Lottery", function ([deployer, user1, user2]) {
  let lottery;
  let betAmount = 5 * 10 ** 15;
  let bet_block_interval = 3;
  let betAmountBN = new web3.utils.BN("5000000000000000");
  beforeEach(async () => {
    lottery = await Lottery.new();
  });

  it("getPot function should return current pot", async () => {
    let pot = await lottery.getPot();
    assert.equal(pot, 0);
  });

  describe("Bet", function () {
    it("should fail when the bet money is not 0.005 ETH", async () => {
      //실패하는 트랜잭션을 전송 후 fail 리턴하는지 확인. 참고로 transaction object = {chainID, value, to, from, gas(Limit), gasPrice}
      //assertRevert함수 안에서 try/catch 문으로 받은 후 catch에서 "revert"란 글자가 리턴값에 들어있는지 확인해서 제대로 된 fail인지 확인한다.
      await assertRevert(
        lottery.bet("0xab", { from: user1, value: 4000000000000000 })
      );
    });
    it("should put the bet to the bet queue with 1 bet", async () => {
      //bet
      let receipt = await lottery.bet("0xab", {
        from: user1,
        value: 5000000000000000,
      });

      //결과 확인(베팅 후 4번째 블록이 생성된 시점) 전이므로 팟머니에 쌓인 돈은 없다.
      let pot = await lottery.getPot();
      assert.equal(pot, 0);

      //check contract balance == 0.005 ETH.   truffle에서는 web3가 주입되어 있으므로 따로 web3 provider 할 필요 없다.
      let contractBalance = await web3.eth.getBalance(lottery.address);
      assert.equal(contractBalance, betAmount);

      //check bet info
      let currentBlockNumber = await web3.eth.getBlockNumber();
      let bet = await lottery.getBetInfo(0);
      assert.equal(
        bet.answerBlockNumber,
        currentBlockNumber + bet_block_interval
      );
      assert.equal(bet.bettor, user1);
      assert.equal(bet.challenges, "0xab");

      //check event log
      await expectEvent.inLogs(receipt.logs, "BET");
    });
  });

  describe("isMatch", function () {
    let blockHash =
      "0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc";
    it("should be BettinfResult.Win when two characters match", async () => {
      let matchingResult = await lottery.isMatch("0xab", blockHash);
      assert.equal(matchingResult, 1);
    });
    it("should be BettinfResult.Fail when two characters is not matched", async () => {
      let blockHash =
        "0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc";
      let matchingResult = await lottery.isMatch("0xcd", blockHash);
      assert.equal(matchingResult, 0);
    });
    it("should be BettinfResult.Draw when only one character is matched", async () => {
      let blockHash =
        "0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc";
      let matchingResult = await lottery.isMatch("0xaf", blockHash);
      assert.equal(matchingResult, 2);

      matchingResult = await lottery.isMatch("0xfb", blockHash);
      assert.equal(matchingResult, 2);
    });
  });

  describe("Distribute", function () {
    describe("When the answer is checkable", function () {
      //두 글자 모두 맞췄을 때 (정답)
      it.only("should give the user the pot when the answer matches", async () => {
        //테스트를 위해 임의로 정답 세팅.
        await lottery.setAnswerForTest(
          "0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc",
          { from: deployer }
        );

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 1번 블록 -> 4번 블록 해시값 베팅
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 2번 블록 -> 5번 블록 해시값 베팅
        await lottery.betAndDistribute("0xab", {
          from: user1,
          value: betAmount,
        }); //3번 블록 -> 6번 블록 해시값 베팅
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 4번 블록

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 5번 블록
        let receipt6 = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); //6번 블록

        let potBefore = await lottery.getPot(); // == 0.01  ETH
        let user1BalanceBeforePot = await web3.eth.getBalance(user1); // origin balance - betting(0.005 ETH)

        let receipt = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 7번 블록 -> 6번 블록의 블록해시값 확인 가능. 유저1에게 팟머니 전송.

        let potAfter = await lottery.getPot(); // 7번 블록에서 팟머니 유저1에게 전송했으니 남은 팟머니는 0
        let user1BalanceAfterPot = await web3.eth.getBalance(user1); // == balanceBeforePot + 0.015 (user1의 베팅금 2개인 0.01 ETH + user2의 베팅금 0.005) ==  origin balance + 0.01 ETH.

        //pot의 변화량 확인
        assert.equal(
          potBefore.toString(),
          new web3.utils.BN("10000000000000000").toString()
        );
        assert.equal(potAfter.toString(), new web3.utils.BN("0").toString());

        //user(winner) balance check
        user1BalanceBeforePot = new web3.utils.BN(user1BalanceBeforePot);
        assert.equal(
          user1BalanceBeforePot.add(potBefore).add(betAmountBN).toString(),
          new web3.utils.BN(user1BalanceAfterPot).toString()
        );
      });
      it("should give the user the amount he or she bet when a single character matches", async () => {
        //  한글자 맞았을 때(베팅액만 돌려줌.)
        await lottery.setAnswerForTest(
          "0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc",
          { from: deployer }
        );

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 1 -> 4
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 2 -> 5
        await lottery.betAndDistribute("0xaf", {
          from: user1,
          value: betAmount,
        }); // 3 -> 6
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 4 -> 7
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 5 -> 8
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 6 -> 9

        let potBefore = await lottery.getPot(); //  == 0.01 ETH
        let user1BalanceBeforePot = await web3.eth.getBalance(user1);

        let receipt7 = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 7 -> 10

        let potAfter = await lottery.getPot(); // == 0.01 ETH
        let user1BalanceAfterPot = await web3.eth.getBalance(user1); // == user1BalanceBeforePot + 0.005 ETH

        // pot 의 변화량 확인
        assert.equal(potBefore.toString(), potAfter.toString());

        // user1(drawer)
        user1BalanceBeforePot = new web3.utils.BN(user1BalanceBeforePot);
        assert.equal(
          user1BalanceBeforePot.add(betAmountBN).toString(),
          new web3.utils.BN(user1BalanceAfterPot).toString()
        );
      });
      it("should get the eth of user when the answer does not match at all", async () => {
        //  틀렸을 때(패배)
        await lottery.setAnswerForTest(
          "0xabec17438e4f0afb9cc8b77ce84bb7fd501497cfa9a1695095247daa5b4b7bcc",
          { from: deployer }
        );

        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 1 -> 4
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 2 -> 5
        await lottery.betAndDistribute("0xef", {
          from: user1,
          value: betAmount,
        }); // 3 -> 6
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 4 -> 7
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 5 -> 8
        await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 6 -> 9

        let potBefore = await lottery.getPot(); //  == 0.01 ETH
        let user1BalanceBeforePot = await web3.eth.getBalance(user1);

        let receipt7 = await lottery.betAndDistribute("0xef", {
          from: user2,
          value: betAmount,
        }); // 7 -> 10 // user1에게 pot이 간다

        let potAfter = await lottery.getPot(); // == 0.015 ETH
        let user1BalanceAfterPot = await web3.eth.getBalance(user1); // == before

        // pot 의 변화량 확인
        assert.equal(
          potBefore.add(betAmountBN).toString(),
          potAfter.toString()
        );

        // user(failer)의 밸런스를 확인
        user1BalanceBeforePot = new web3.utils.BN(user1BalanceBeforePot);
        assert.equal(
          user1BalanceBeforePot.toString(),
          new web3.utils.BN(user1BalanceAfterPot).toString()
        );
      });
    });
    describe("When the answer is not revealed(Not Mined)", function () {});
    describe("When the answer is not revealed(Block limit is passed)", function () {});
  });
});
