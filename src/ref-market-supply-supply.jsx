const Container = styled.div`
  .template .title {
    font-size: 14px;
    color: #7e8a93;
  }
  .template .value {
    font-size: 14px;
    color: #fff;
  }
  .mt_25 {
    margin-top: 25px;
  }
  .greenButton {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #00ffd1;
    border-radius: 12px;
    height: 46px;
    font-weight: 700;
    font-size: 18px;
    color: #000;
    cursor: pointer;
    width: 100%;
  }
  .disabled {
    opacity: 0.3;
    cursor: not-allowed !important;
  }
  .switchButton {
    display: flex;
    align-items: center;
    width: 36px;
    height: 20px;
    border-radius: 14px;
    padding: 2px 3px;
    cursor: pointer;
    margin-left: 8px;
  }
  .justify-end {
    background: #00c6a2;
  }
  .justify-start {
    background: #ccc;
  }
  .switchButton .whiteBall {
    width: 15px;
    height: 15px;
    background: #ffffff;
    box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.5);
    border-radius: 100px;
    transition: all 100ms ease-out;
    cursor: pointer;
  }
  .justify-end .whiteBall {
    margin-left: 14px;
  }
  .justify-start .whiteBall {
    margin-left: 2px;
  }
  .flex-center {
    display: flex;
    align-items: center;
  }
`;
const Backdrop = styled.div`
  height: 100vh;
  width: 100vw;
  background-color: rgba(0, 0, 0, 0.6);
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1001;
`;
const Modal = styled.div`
  background-color: #1a2e33;
  border-radius: 12px;
  position: fixed;
  z-index: 1002;
  width: 30rem;
  max-width: 95vw;
  max-height: 80vh;
  padding: 10px 0 20px 0;
  animation: anishow 0.3s forwards ease-out;
  left: 50%;
  top: 50%;
  @keyframes anishow {
    from {
      opacity: 0;
      transform: translate(-50%, -70%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: start;
    color: #fff;
    font-weight: 700;
    font-size: 18px;
    padding: 12px 20px;
    margin-bottom: 16px;
    border-bottom: 2px solid rgba(48, 67, 82, 0.5);
  }
  .modal-header .title {
    font-weight: 700;
    font-size: 18px;
    color: #fff;
  }
  .modal-header .btn-close {
    position: absolute;
    right: 28px;
    margin: 0;
  }
  .modal-body {
    padding: 0 16px;
  }
  .btn-close-custom {
    position: absolute;
    right: 28px;
    width: 12px;
    height: 12px;
    cursor: pointer;
  }
`;
let accountId = context.accountId;
if (!accountId) {
  return <Widget src="juaner.near/widget/ref_account-signin" />;
}
let BURROW_CONTRACT = "contract.main.burrow.near";
const NO_STORAGE_DEPOSIT_CONTRACTS = ["aurora", "meta-pool.near"];
let MAX_RATIO = 10_000;
let B = Big();
B.DP = 60;
const toAPY = (v) => Math.round(v * 100) / 100;
const clone = (o) => JSON.parse(JSON.stringify(o));
const shrinkToken = (value, decimals) => {
  return new Big(value).div(new Big(10).pow(decimals || 0));
};
const expandToken = (value, decimals) => {
  return new Big(value).mul(new Big(10).pow(decimals || 0));
};
const formatToken = (v) => Math.floor(v * 10_000) / 10_000;
const { selectedTokenId, closeModal, showModal, selectedTokenMeta } = props;
const {
  rewards,
  account: burrowAccount,
  amount,
  hasError,
  assets,
  cfButtonStatus,
  newHealthFactor,
  wnearbase64,
  closeButtonBase64,
  isMax,
} = state;
const hasData = assets.length > 0 && rewards.length > 0;
if (!showModal) {
  State.update({
    amount: "",
    hasError: false,
    cfButtonStatus: false,
    newHealthFactor: "",
  });
}
const onLoad = (data) => {
  State.update(data);
};
const account = fetch("https://rpc.mainnet.near.org", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "dontcare",
    method: "query",
    params: {
      request_type: "view_account",
      finality: "final",
      account_id: accountId,
    },
  }),
});
if (!account) {
  return null;
}
let nearBalance = "0";
let vailableBalance = 0;
let vailableBalance$ = 0;
let apy = 0;
let cf = "-";
let asset;
const getBalanceOfnear = () => {
  if (!assets) return "0";
  const asset = assets.find((a) => a.token_id === selectedTokenId);
  const { amount, storage_usage } = account.body.result;
  const near_b = Big(amount || 0).minus(
    Big(storage_usage || 0).mul(Big(10).pow(19))
  );
  const wnear_b = asset.accountBalance || 0;
  const total_b = near_b.plus(wnear_b);
  const total_b_avalible = shrinkToken(total_b.toFixed(), 24).minus(0.25);
  if (total_b_avalible.gt(0)) {
    nearBalance = total_b_avalible.toFixed();
  }
};
getBalanceOfnear();
const getBalance = (asset) => {
  if (!asset) return 0;
  const { accountBalance, metadata } = asset;
  return shrinkToken(accountBalance, metadata.decimals).toFixed();
};
const getApy = (asset) => {
  if (!asset && !rewards) return 0;
  const r = rewards.find((a) => a.token_id === asset.token_id);
  const totalApy = r.apyBase + r.apyRewardTvl + r.apyReward;
  return toAPY(totalApy);
};
if (selectedTokenId && assets) {
  asset = assets.find((a) => a.token_id === selectedTokenId);
  vailableBalance =
    selectedTokenId === "wrap.near" ? nearBalance : getBalance(asset);
  apy = getApy(asset);
  cf = asset.config.volatility_ratio / 100;
  vailableBalance$ = Big(asset.price.usd || 0)
    .mul(vailableBalance || 0)
    .toFixed(2);
}
const storageBurrow = Near.view(BURROW_CONTRACT, "storage_balance_of", {
  account_id: accountId,
});
const storageToken = selectedTokenId
  ? Near.view(selectedTokenId, "storage_balance_of", {
      account_id: accountId,
    })
  : null;
const handleAmount = (value, isMax) => {
  const amount = value;
  const newHF = recomputeHealthFactor(selectedTokenId, amount);
  State.update({
    amount,
    selectedTokenId,
    hasError: false,
    newHealthFactor: newHF,
    isMax,
  });
};
const handleDeposit = () => {
  if (!selectedTokenId || !amount || hasError) return;
  const amountValue = isMax ? vailableBalance : amount;
  if (selectedTokenId === "wrap.near") {
    handleDepositNear(amountValue);
    return;
  }
  const asset = assets.find((a) => a.token_id === selectedTokenId);
  const { token_id, metadata, config } = asset;
  const expandedAmount = expandToken(amountValue, metadata.decimals).toFixed();
  const collateralAmount = expandToken(
    amountValue,
    metadata.decimals + config.extra_decimals
  ).toFixed();
  const collateralMsg =
    config.can_use_as_collateral && cfButtonStatus
      ? `{"Execute":{"actions":[{"IncreaseCollateral":{"token_id": "${token_id}","max_amount":"${collateralAmount}"}}]}}`
      : "";
  const transactions = [];
  const depositTransaction = {
    contractName: token_id,
    methodName: "ft_transfer_call",
    deposit: new Big("1").toFixed(),
    gas: expandToken(300, 12),
    args: {
      receiver_id: BURROW_CONTRACT,
      amount: expandedAmount,
      msg: collateralMsg,
    },
  };
  if (
    !(storageToken && storageToken.total != "0") &&
    !NO_STORAGE_DEPOSIT_CONTRACTS.includes(token_id)
  ) {
    transactions.push({
      contractName: token_id,
      methodName: "storage_deposit",
      deposit: expandToken(0.25, 24).toFixed(),
    });
  }
  if (storageBurrow?.available === "0" || !storageBurrow?.available) {
    transactions.push({
      contractName: BURROW_CONTRACT,
      methodName: "storage_deposit",
      deposit: expandToken(0.25, 24).toFixed(),
      gas: expandToken(140, 12),
    });
  }
  transactions.push(depositTransaction);
  Near.call(transactions);
};
const handleDepositNear = (amount) => {
  const expandedAmount = expandToken(amount, 24);
  const amountDecimal = expandedAmount.toFixed();
  const extraDecimal = expandedAmount.sub(asset.accountBalance || 0);
  const transactions = [
    ...(extraDecimal.gt(0)
      ? [
          {
            contractName: "wrap.near",
            methodName: "near_deposit",
            deposit: extraDecimal.toFixed(),
            gas: expandToken(300, 12),
          },
        ]
      : []),
    {
      contractName: "wrap.near",
      methodName: "ft_transfer_call",
      deposit: new Big("1").toFixed(),
      gas: expandToken(300, 12),
      args: {
        receiver_id: BURROW_CONTRACT,
        amount: amountDecimal,
        msg: cfButtonStatus
          ? `{"Execute":{"actions":[{"IncreaseCollateral":{"token_id":"wrap.near","max_amount":"${amountDecimal}"}}]}}`
          : "",
      },
    },
  ];
  if (storageBurrow?.available === "0" || !storageBurrow?.available) {
    transactions.unshift({
      contractName: BURROW_CONTRACT,
      methodName: "storage_deposit",
      deposit: expandToken(0.25, 24).toFixed(),
      gas: expandToken(140, 12),
    });
  }
  Near.call(transactions);
};
function getAdjustedSum(type, burrowAccount) {
  if (!assets || !burrowAccount || burrowAccount[type].length == 0) return 0;
  return burrowAccount[type]
    .map((assetInAccount) => {
      const asset = assets.find((a) => a.token_id === assetInAccount.token_id);

      const price = asset.price
        ? B(asset.price.multiplier).div(B(10).pow(asset.price.decimals || 0))
        : B(0);

      const pricedBalance = B(assetInAccount.balance)
        .div(expandToken(1, asset.config.extra_decimals))
        .mul(price);
      return type === "borrowed"
        ? pricedBalance
            .div(asset.config.volatility_ratio)
            .mul(MAX_RATIO)
            .toFixed()
        : pricedBalance
            .mul(asset.config.volatility_ratio)
            .div(MAX_RATIO)
            .toFixed();
    })
    .reduce((sum, cur) => B(sum).plus(B(cur)).toFixed());
}
const adjustedCollateralSum = getAdjustedSum("collateral", burrowAccount);
const adjustedBorrowedSum = getAdjustedSum("borrowed", burrowAccount);
function getHealthFactor() {
  if (Big(adjustedBorrowedSum).eq(0)) return 10000;
  const healthFactor = B(adjustedCollateralSum)
    .div(B(adjustedBorrowedSum))
    .mul(100)
    .toFixed(2);
  return Number(healthFactor) < MAX_RATIO ? healthFactor : MAX_RATIO;
}
const healthFactor = getHealthFactor();
const canUseAsCollateral = asset.config.can_use_as_collateral;
function switchButtonStatus() {
  if (canUseAsCollateral) {
    State.update({
      cfButtonStatus: !cfButtonStatus,
    });
  }
}
const recomputeHealthFactor = (tokenId, amount) => {
  if (!tokenId || !amount || !assets || !burrowAccount) return null;
  const asset = assets.find((a) => a.token_id === tokenId);
  const decimals = asset.metadata.decimals + asset.config.extra_decimals;
  const accountCollateralAsset = burrowAccount.collateral.find(
    (a) => a.token_id === tokenId
  );
  const newBalance = expandToken(amount, decimals)
    .plus(B(accountCollateralAsset?.balance || 0))
    .toFixed();
  const clonedAccount = clone(burrowAccount);
  const updatedToken = {
    token_id: tokenId,
    balance: newBalance,
    shares: newBalance,
    apr: "0",
  };
  if (clonedAccount?.collateral.length === 0) {
    clonedAccount.collateral = [updatedToken];
  } else if (!accountCollateralAsset) {
    clonedAccount.collateral.push(updatedToken);
  } else {
    clonedAccount.collateral = [
      ...clonedAccount.collateral.filter((a) => a.token_id !== tokenId),
      updatedToken,
    ];
  }
  const adjustedCollateralSum = getAdjustedSum(
    "collateral",
    amount === 0 ? burrowAccount : clonedAccount
  );
  const adjustedBorrowedSum = getAdjustedSum("borrowed", burrowAccount);
  let newHealthFactor;
  if (Big(adjustedBorrowedSum).eq(0)) {
    newHealthFactor = 10000;
  } else {
    newHealthFactor = B(adjustedCollateralSum)
      .div(B(adjustedBorrowedSum))
      .mul(100)
      .toFixed(2);
  }
  return Number(newHealthFactor) < MAX_RATIO ? newHealthFactor : MAX_RATIO;
};
function getWnearIcon(icon) {
  State.update({
    wnearbase64: icon,
  });
}
function getCloseButtonIcon(icon) {
  State.update({
    closeButtonBase64: icon,
  });
}
return (
  <Container>
    {!hasData && (
      <Widget src="juaner.near/widget/ref_burrow-data" props={{ onLoad }} />
    )}
    <Widget
      src="juaner.near/widget/ref-icons"
      props={{ getWnearIcon, getCloseButtonIcon }}
    />
    <Modal style={{ display: showModal ? "block" : "none" }}>
      <div class="modal-header">
        <div class="title">Supply&nbsp; {selectedTokenMeta.symbol}</div>
        <img
          class="btn-close-custom"
          src={closeButtonBase64}
          onClick={closeModal}
        />
      </div>
      <div class="modal-body">
        <div class="content">
          <Widget
            src="juaner.near/widget/ref-input-box"
            props={{
              amount,
              handleAmount,
              balance: vailableBalance,
              balance$: vailableBalance$,
              metadata: asset.metadata,
            }}
          />
          <div class="template mt_25">
            <span class="title">Health Factor</span>
            <span class="value">
              {newHealthFactor && cfButtonStatus
                ? newHealthFactor
                : healthFactor}
              %
            </span>
          </div>
          <div class="template mt_25">
            <span class="title">Collateral Factor</span>
            <div class="flex-center">
              <span class="value">{cf}%</span>
              <div
                class={`switchButton ${canUseAsCollateral ? "" : "disabled"} ${
                  cfButtonStatus ? "justify-end" : "justify-start"
                }`}
                onClick={switchButtonStatus}
              >
                <label
                  class={`whiteBall ${canUseAsCollateral ? "" : "disabled"}`}
                ></label>
              </div>
            </div>
          </div>
          <div
            class={`greenButton mt_25  ${Number(amount) ? "" : "disabled"}`}
            onClick={handleDeposit}
          >
            Supply
          </div>
        </div>
      </div>
    </Modal>
    <Backdrop
      style={{ display: showModal ? "block" : "none" }}
      onClick={closeModal}
    ></Backdrop>
  </Container>
);
