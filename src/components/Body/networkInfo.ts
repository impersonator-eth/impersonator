const networkInfo: {
  chainID: number;
  name: string;
  rpc: string;
}[] = [
  {
    chainID: 1,
    name: "Ethereum Mainnet",
    rpc: `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  {
    chainID: 42161,
    name: "Arbitrum One",
    rpc: "https://arb1.arbitrum.io/rpc",
  },
  {
    chainID: 10,
    name: "Optimism",
    rpc: "https://mainnet.optimism.io",
  },
  {
    chainID: 137,
    name: "Polygon",
    rpc: "https://polygon-rpc.com",
  },
  {
    chainID: 56,
    name: "Binance Smart Chain",
    rpc: "https://bscrpc.com",
  },
  {
    chainID: 250,
    name: "Fantom Opera",
    rpc: "https://rpc.fantom.network",
  },
  {
    chainID: 43114,
    name: "Avalanche",
    rpc: "https://rpc.ankr.com/avalanche",
  },
  {
    chainID: 100,
    name: "Gnosis",
    rpc: "https://rpc.ankr.com/gnosis",
  },
  {
    chainID: 42,
    name: "Kovan Testnet",
    rpc: `https://kovan.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  {
    chainID: 3,
    name: "Ropsten Testnet",
    rpc: `https://ropsten.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  {
    chainID: 4,
    name: "Rinkeby Testnet",
    rpc: `https://rinkeby.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
  {
    chainID: 5,
    name: "Goerli Testnet",
    rpc: `https://goerli.infura.io/v3/${process.env.REACT_APP_INFURA_KEY}`,
  },
];

export default networkInfo;
