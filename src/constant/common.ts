export enum PurchaseType {
  BUY = "BUY",
  SELL = "SELL",
}

export enum TokenType {
  SENTIENT = "SENTIENT",
  PROTOTYPE = "PROTOTYPE",
}

export const CONFIG = {
  UNISWAP_UNIVERSAL_ROUTER_ADDR: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
  UNISWAP_V2_ROUTER_ADDR: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
  VIRTUALS_TOKEN_ADDR: "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b",
  VIRTUAL_ROUTER_ADDR: "0x8292B43aB73EfAC11FAF357419C38ACF448202C5",
  BONDING_CURVE_ADDR: "0xF66DeA7b3e897cD44A5a231c61B6B4423d613259",
  TAX_RATE: 0.01, // 1% tax rate for the prototype token transactions
  SOLANA_VIRTUALS_TOKEN_ADDR: "3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y",
};

export const FILTER_AGENT_STATUS = {
  PROTOTYPE: 1,
  SENTIENT: 2,
  SEARCH: 3,
};

export enum AGENT_CHAIN_ID {
  ALL = 0,
  BASE = 1,
  SOLANA = 2,
}

export const AGENT_CHAIN_MAP = {
  [AGENT_CHAIN_ID.BASE]: "BASE",
  [AGENT_CHAIN_ID.SOLANA]: "SOLANA",
};
export enum KLINE_CHAIN_ID {
  BASE = 0,
  SOLANA = 1,
}
