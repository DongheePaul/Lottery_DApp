//build 폴더 안에 있는 Lottery 파일(바이트코드)을 가져옴.
const Lottery = artifacts.require("Lottery");
/**
가져온 바이트코드를 deployer가 배포함. 
실제 이더리움에서 스-컨 배포하기 위해선 주소가 필요한데, truffle-config.js에서 내가 사용할 주소를 세팅하면 해당 주소가 deployer에 매핑됨.
*/
module.exports = function (deployer) {
  deployer.deploy(Lottery);
};
