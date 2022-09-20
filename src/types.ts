import { BigNumberish, BytesLike } from "ethers";

export declare const INTERFACE_MESSAGES: {
  readonly ENV_INFO: "ENV_INFO";
  readonly ON_SAFE_INFO: "ON_SAFE_INFO";
  readonly TRANSACTION_CONFIRMED: "TRANSACTION_CONFIRMED";
  readonly TRANSACTION_REJECTED: "TRANSACTION_REJECTED";
};
export type InterfaceMessageIds = keyof typeof INTERFACE_MESSAGES;

export declare type LowercaseNetworks =
  | "mainnet"
  | "morden"
  | "ropsten"
  | "rinkeby"
  | "goerli"
  | "kovan"
  | "xdai"
  | "energy_web_chain"
  | "volta"
  | "unknown";
export interface SafeInfo {
  safeAddress: string;
  network: LowercaseNetworks;
  ethBalance: string;
}
export interface InterfaceMessageToPayload {
  [INTERFACE_MESSAGES.ON_SAFE_INFO]: SafeInfo;
  [INTERFACE_MESSAGES.TRANSACTION_CONFIRMED]: {
    safeTxHash: string;
  };
  [INTERFACE_MESSAGES.ENV_INFO]: {
    txServiceUrl: string;
  };
  [INTERFACE_MESSAGES.TRANSACTION_REJECTED]: Record<string, unknown>;
}
export type InterfaceMessageProps<T extends InterfaceMessageIds> = {
  messageId: T;
  data: InterfaceMessageToPayload[T];
};
export declare type RequestId = number | string;

// Messaging
export enum Methods {
  sendTransactions = "sendTransactions",
  rpcCall = "rpcCall",
  getChainInfo = "getChainInfo",
  getSafeInfo = "getSafeInfo",
  getTxBySafeTxHash = "getTxBySafeTxHash",
  getSafeBalances = "getSafeBalances",
  signMessage = "signMessage",
  signTypedMessage = "signTypedMessage",
  getEnvironmentInfo = "getEnvironmentInfo",
  requestAddressBook = "requestAddressBook",
  wallet_getPermissions = "wallet_getPermissions",
  wallet_requestPermissions = "wallet_requestPermissions",
}
export declare type SDKRequestData<M extends Methods = Methods, P = unknown> = {
  id: RequestId;
  params: P;
  env: {
    sdkVersion: string;
  };
  method: M;
};
export declare type SDKMessageEvent = MessageEvent<SDKRequestData>;
export declare type SendTransactionsResponse = {
  safeTxHash: string;
};
export enum RPC_AUTHENTICATION {
  API_KEY_PATH = "API_KEY_PATH",
  NO_AUTHENTICATION = "NO_AUTHENTICATION",
  UNKNOWN = "UNKNOWN",
}
export type RpcUri = {
  authentication: RPC_AUTHENTICATION;
  value: string;
};
export type BlockExplorerUriTemplate = {
  address: string;
  txHash: string;
  api: string;
};
export type NativeCurrency = {
  name: string;
  symbol: string;
  decimals: number;
  logoUri: string;
};
export type Theme = {
  textColor: string;
  backgroundColor: string;
};
export enum GAS_PRICE_TYPE {
  ORACLE = "ORACLE",
  FIXED = "FIXED",
  UNKNOWN = "UNKNOWN",
}
export type GasPriceOracle = {
  type: GAS_PRICE_TYPE.ORACLE;
  uri: string;
  gasParameter: string;
  gweiFactor: string;
};
export type GasPriceFixed = {
  type: GAS_PRICE_TYPE.FIXED;
  weiValue: string;
};
export type GasPriceUnknown = {
  type: GAS_PRICE_TYPE.UNKNOWN;
};
export type GasPrice = (GasPriceOracle | GasPriceFixed | GasPriceUnknown)[];
export enum FEATURES {
  ERC721 = "ERC721",
  SAFE_APPS = "SAFE_APPS",
  CONTRACT_INTERACTION = "CONTRACT_INTERACTION",
  DOMAIN_LOOKUP = "DOMAIN_LOOKUP",
  SPENDING_LIMIT = "SPENDING_LIMIT",
  EIP1559 = "EIP1559",
  SAFE_TX_GAS_OPTIONAL = "SAFE_TX_GAS_OPTIONAL",
  TX_SIMULATION = "TX_SIMULATION",
}
export type _ChainInfo = {
  transactionService: string;
  chainId: string; // Restricted by what is returned by the CGW
  chainName: string;
  shortName: string;
  l2: boolean;
  description: string;
  rpcUri: RpcUri;
  safeAppsRpcUri: RpcUri;
  publicRpcUri: RpcUri;
  blockExplorerUriTemplate: BlockExplorerUriTemplate;
  nativeCurrency: NativeCurrency;
  theme: Theme;
  ensRegistryAddress?: string;
  gasPrice: GasPrice;
  disabledWallets: string[];
  features: FEATURES[];
};
export declare type ChainInfo = Pick<
  _ChainInfo,
  | "chainName"
  | "chainId"
  | "shortName"
  | "nativeCurrency"
  | "blockExplorerUriTemplate"
>;
export enum TransactionStatus {
  AWAITING_CONFIRMATIONS = "AWAITING_CONFIRMATIONS",
  AWAITING_EXECUTION = "AWAITING_EXECUTION",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  SUCCESS = "SUCCESS",
  PENDING = "PENDING",
  WILL_BE_REPLACED = "WILL_BE_REPLACED",
}
export type AddressEx = {
  value: string;
  name?: string;
  logoUri?: string;
};
export enum TransferDirection {
  INCOMING = "INCOMING",
  OUTGOING = "OUTGOING",
  UNKNOWN = "UNKNOWN",
}
export enum TransactionTokenType {
  ERC20 = "ERC20",
  ERC721 = "ERC721",
  NATIVE_COIN = "NATIVE_COIN",
}
export type Erc20Transfer = {
  type: TransactionTokenType.ERC20;
  tokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
  logoUri?: string;
  decimals?: number;
  value: string;
};
export type Erc721Transfer = {
  type: TransactionTokenType.ERC721;
  tokenAddress: string;
  tokenId: string;
  tokenName?: string;
  tokenSymbol?: string;
  logoUri?: string;
};
export type NativeCoinTransfer = {
  type: TransactionTokenType.NATIVE_COIN;
  value: string;
};
export type TransferInfo = Erc20Transfer | Erc721Transfer | NativeCoinTransfer;
export interface Transfer {
  type: "Transfer";
  sender: AddressEx;
  recipient: AddressEx;
  direction: TransferDirection;
  transferInfo: TransferInfo;
}
export type ParamValue = string | ParamValue[];
export enum Operation {
  CALL = 0,
  DELEGATE = 1,
}
export type InternalTransaction = {
  operation: Operation;
  to: string;
  value?: string;
  data?: string;
  dataDecoded?: DataDecoded;
};
export type ValueDecodedType = InternalTransaction[];
export type Parameter = {
  name: string;
  type: string;
  value: ParamValue;
  valueDecoded?: ValueDecodedType;
};
export type DataDecoded = {
  method: string;
  parameters?: Parameter[];
};
export enum SettingsInfoType {
  SET_FALLBACK_HANDLER = "SET_FALLBACK_HANDLER",
  ADD_OWNER = "ADD_OWNER",
  REMOVE_OWNER = "REMOVE_OWNER",
  SWAP_OWNER = "SWAP_OWNER",
  CHANGE_THRESHOLD = "CHANGE_THRESHOLD",
  CHANGE_IMPLEMENTATION = "CHANGE_IMPLEMENTATION",
  ENABLE_MODULE = "ENABLE_MODULE",
  DISABLE_MODULE = "DISABLE_MODULE",
  SET_GUARD = "SET_GUARD",
  DELETE_GUARD = "DELETE_GUARD",
}
export type SetFallbackHandler = {
  type: SettingsInfoType.SET_FALLBACK_HANDLER;
  handler: AddressEx;
};
export type AddOwner = {
  type: SettingsInfoType.ADD_OWNER;
  owner: AddressEx;
  threshold: number;
};
export type SettingsInfo =
  | SetFallbackHandler
  | AddOwner
  | RemoveOwner
  | SwapOwner
  | ChangeThreshold
  | ChangeImplementation
  | EnableModule
  | DisableModule
  | SetGuard
  | DeleteGuard;
export type RemoveOwner = {
  type: SettingsInfoType.REMOVE_OWNER;
  owner: AddressEx;
  threshold: number;
};
export type SwapOwner = {
  type: SettingsInfoType.SWAP_OWNER;
  oldOwner: AddressEx;
  newOwner: AddressEx;
};
export type ChangeThreshold = {
  type: SettingsInfoType.CHANGE_THRESHOLD;
  threshold: number;
};
export type ChangeImplementation = {
  type: SettingsInfoType.CHANGE_IMPLEMENTATION;
  implementation: AddressEx;
};
export type EnableModule = {
  type: SettingsInfoType.ENABLE_MODULE;
  module: AddressEx;
};
export type DisableModule = {
  type: SettingsInfoType.DISABLE_MODULE;
  module: AddressEx;
};
export type SetGuard = {
  type: SettingsInfoType.SET_GUARD;
  guard: AddressEx;
};
export type DeleteGuard = {
  type: SettingsInfoType.DELETE_GUARD;
};
export type SettingsChange = {
  type: "SettingsChange";
  dataDecoded: DataDecoded;
  settingsInfo?: SettingsInfo;
};
export interface Custom {
  type: "Custom";
  to: AddressEx;
  dataSize: string;
  value: string;
  methodName?: string;
  actionCount?: number;
  isCancellation: boolean;
}
export type MultiSend = {
  type: "Custom";
  to: AddressEx;
  dataSize: string;
  value: string;
  methodName: "multiSend";
  actionCount: number;
  isCancellation: boolean;
};
export type Cancellation = Custom & {
  isCancellation: true;
};
export type Creation = {
  type: "Creation";
  creator: AddressEx;
  transactionHash: string;
  implementation?: AddressEx;
  factory?: AddressEx;
};
export type TransactionInfo =
  | Transfer
  | SettingsChange
  | Custom
  | MultiSend
  | Cancellation
  | Creation;
export type TransactionData = {
  hexData?: string;
  dataDecoded?: DataDecoded;
  to: AddressEx;
  value?: string;
  operation: Operation;
  addressInfoIndex?: { [key: string]: AddressEx };
  trustedDelegateCallTarget: boolean;
};
export type ModuleExecutionDetails = {
  type: "MODULE";
  address: AddressEx;
};
export type MultisigConfirmation = {
  signer: AddressEx;
  signature?: string;
  submittedAt: number;
};
export enum TokenType {
  ERC20 = "ERC20",
  ERC721 = "ERC721",
  NATIVE_TOKEN = "NATIVE_TOKEN",
}
export type TokenInfo = {
  type: TokenType;
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  logoUri: string;
};
export type MultisigExecutionDetails = {
  type: "MULTISIG";
  submittedAt: number;
  nonce: number;
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: string;
  refundReceiver: AddressEx;
  safeTxHash: string;
  executor?: AddressEx;
  signers: AddressEx[];
  confirmationsRequired: number;
  confirmations: MultisigConfirmation[];
  rejectors?: AddressEx[];
  gasTokenInfo?: TokenInfo;
};
export type DetailedExecutionInfo =
  | ModuleExecutionDetails
  | MultisigExecutionDetails;
export type SafeAppInfo = {
  name: string;
  url: string;
  logoUri: string;
};
export type TransactionDetails = {
  txId: string;
  executedAt?: number;
  txStatus: TransactionStatus;
  txInfo: TransactionInfo;
  txData?: TransactionData;
  detailedExecutionInfo?: DetailedExecutionInfo;
  txHash?: string;
  safeAppInfo?: SafeAppInfo;
};
export declare type GatewayTransactionDetails = TransactionDetails;
export type SafeBalanceResponse = {
  fiatTotal: string;
  items: Array<{
    tokenInfo: TokenInfo;
    balance: string;
    fiatBalance: string;
    fiatConversion: string;
  }>;
};
export declare type SafeBalances = SafeBalanceResponse;
export declare type EnvironmentInfo = {
  origin: string;
};
export declare type AddressBookItem = {
  address: string;
  chainId: string;
  name: string;
};
export declare type PermissionCaveat = {
  type: string;
  value?: unknown;
  name?: string;
};
export declare type Permission = {
  parentCapability: string;
  invoker: string;
  date?: number;
  caveats?: PermissionCaveat[];
};
export interface MethodToResponse {
  [Methods.sendTransactions]: SendTransactionsResponse;
  [Methods.rpcCall]: unknown;
  [Methods.getSafeInfo]: SafeInfo;
  [Methods.getChainInfo]: ChainInfo;
  [Methods.getTxBySafeTxHash]: GatewayTransactionDetails;
  [Methods.getSafeBalances]: SafeBalances[];
  [Methods.signMessage]: SendTransactionsResponse;
  [Methods.signTypedMessage]: SendTransactionsResponse;
  [Methods.getEnvironmentInfo]: EnvironmentInfo;
  [Methods.requestAddressBook]: AddressBookItem[];
  [Methods.wallet_getPermissions]: Permission[];
  [Methods.wallet_requestPermissions]: Permission[];
}
export declare type ErrorResponse = {
  id: RequestId;
  success: false;
  error: string;
  version?: string;
};
export type SuccessResponse<T = MethodToResponse[Methods]> = {
  id: RequestId;
  data: T;
  version?: string;
  success: true;
};
export declare const RPC_CALLS: {
  readonly eth_call: "eth_call";
  readonly eth_gasPrice: "eth_gasPrice";
  readonly eth_getLogs: "eth_getLogs";
  readonly eth_getBalance: "eth_getBalance";
  readonly eth_getCode: "eth_getCode";
  readonly eth_getBlockByHash: "eth_getBlockByHash";
  readonly eth_getBlockByNumber: "eth_getBlockByNumber";
  readonly eth_getStorageAt: "eth_getStorageAt";
  readonly eth_getTransactionByHash: "eth_getTransactionByHash";
  readonly eth_getTransactionReceipt: "eth_getTransactionReceipt";
  readonly eth_getTransactionCount: "eth_getTransactionCount";
  readonly eth_estimateGas: "eth_estimateGas";
};

export declare type RpcCallNames = keyof typeof RPC_CALLS;
export declare type RPCPayload<P = unknown[]> = {
  call: RpcCallNames;
  params: P | unknown[];
};
export interface MethodToResponse {
  [Methods.sendTransactions]: SendTransactionsResponse;
  [Methods.rpcCall]: unknown;
  [Methods.getSafeInfo]: SafeInfo;
  [Methods.getChainInfo]: ChainInfo;
  [Methods.getTxBySafeTxHash]: GatewayTransactionDetails;
  [Methods.getSafeBalances]: SafeBalances[];
  [Methods.signMessage]: SendTransactionsResponse;
  [Methods.signTypedMessage]: SendTransactionsResponse;
  [Methods.getEnvironmentInfo]: EnvironmentInfo;
  [Methods.requestAddressBook]: AddressBookItem[];
  [Methods.wallet_getPermissions]: Permission[];
  [Methods.wallet_requestPermissions]: Permission[];
}
export declare type SignMessageParams = {
  message: string;
};
export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: BigNumberish;
  verifyingContract?: string;
  salt?: BytesLike;
}
export interface TypedDataTypes {
  name: string;
  type: string;
}
export declare type TypedMessageTypes = {
  [key: string]: TypedDataTypes[];
};
export declare type EIP712TypedData = {
  domain: TypedDataDomain;
  types: TypedMessageTypes;
  message: Record<string, any>;
};
export declare type SignTypedMessageParams = {
  typedData: EIP712TypedData;
};
export interface Transaction {
  to: string;
  value: string;
  data: string;
}
