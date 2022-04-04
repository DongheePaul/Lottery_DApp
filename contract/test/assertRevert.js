module.exports = async (promise) => {
  try {
    //넘어온 promise에 await를 걸어존다.
    await promise;
    //만약 promise 기다렸는데 catch문 쪽으로 넘어가지 않으면 잘못된 것
    assert.fail("Expected revert not received");
  } catch (error) {
    const revertFound = error.message.search("revert") >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
};
