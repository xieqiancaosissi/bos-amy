const Container = styled.div`
  .template {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-left: 6px;
  }
  .template .title {
    font-size: 14px;
    color: #7e8a93;
  }
  .template .value {
    font-size: 14px;
    color: #fff;
  }
  .template .usd {
    color: #7e8a93;
  }
  .mt_25 {
    margin-top: 25px;
  }
  .mt-10 {
    margin-top: 10px;
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
    cursor: not-allowed;
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
  .modal-body .tab {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
  }
  .modal-body .tab span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50%;
    height: 40px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 18px;
    cursor: pointer;
    color: #fff;
  }
  .modal-body .tab span.active {
    background: #304352;
  }
  .btn-close-custom {
    position: absolute;
    right: 28px;
    width: 12px;
    height: 12px;
    cursor: pointer;
  }
`;
/** base tool start  */
let accountId = context.accountId;
if (!accountId) {
  return <Widget src="juaner.near/widget/ref_account-signin" />;
}
let MAX_RATIO = 10_000;
let B = Big();
B.DP = 60; // set precision to 60 decimals
const NO_STORAGE_DEPOSIT_CONTRACTS = ["aurora", "meta-pool.near"];
let BURROW_CONTRACT = "contract.main.burrow.near";
const toAPY = (v) => Math.round(v * 100) / 100;
const clone = (o) => JSON.parse(JSON.stringify(o));
const shrinkToken = (value, decimals) => {
  return new Big(value).div(new Big(10).pow(decimals));
};

const expandToken = (value, decimals) => {
  return new Big(value).mul(new Big(10).pow(decimals));
};
const formatToken = (v) => Math.floor(v * 10_000) / 10_000;
const { selectedTokenId, selectedTokenMeta, showModal, closeModal } = props;
const {
  rewards,
  account,
  balances,
  amount,
  hasError,
  assets,
  newHealthFactor,
  wnearbase64,
  closeButtonBase64,
  nearBalance,
  isMax,
} = state;
if (!showModal) {
  State.update({
    amount: "",
    hasError: false,
    newHealthFactor: "",
  });
}
const hasData = assets.length > 0 && rewards.length > 0 && account;
/** base tool end */
const onLoad = (data) => {
  State.update(data);
};
/** logic start */
let availableBalance = 0;
let availableBalance$ = 0;
let apy = 0;
let asset;

const getBalance = (asset) => {
  if (!asset) return 0;
  const { accountBalance, metadata } = asset;
  return formatToken(shrinkToken(accountBalance, metadata.decimals).toFixed());
};

const getApy = (asset) => {
  if (!asset) return 0;
  const r = rewards.find((a) => a.token_id === asset.token_id);
  return toAPY(r.apyBaseBorrow);
};

if (selectedTokenId && assets && account) {
  asset = assets.find((a) => a.token_id === selectedTokenId);
  const borrowed = account.borrowed.find((a) => a.token_id === selectedTokenId);
  const decimals = asset.metadata.decimals + asset.config.extra_decimals;
  const borrowedBalance = shrinkToken(borrowed.balance || 0, decimals);
  const walletBalance =
    selectedTokenId === "wrap.near" ? nearBalance : getBalance(asset);
  availableBalance = Math.min(borrowedBalance, walletBalance);
  availableBalance$ = Big(availableBalance)
    .mul(asset.price.usd || 0)
    .toFixed(2);
  apy = getApy(asset);
}

const storageBurrow = Near.view(BURROW_CONTRACT, "storage_balance_of", {
  account_id: accountId,
});
function getAdjustedSum(type, account) {
  if (!assets || !account || account[type].length == 0) return 0;
  return account[type]
    .map((assetInAccount) => {
      const asset = assets.find((a) => a.token_id === assetInAccount.token_id);

      const price = asset.price
        ? B(asset.price.multiplier).div(B(10).pow(asset.price.decimals))
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

const adjustedCollateralSum = getAdjustedSum("collateral", account);
const adjustedBorrowedSum = getAdjustedSum("borrowed", account);

function getHealthFactor() {
  if (Big(adjustedBorrowedSum).eq(0)) return 10000;
  const healthFactor = B(adjustedCollateralSum)
    .div(B(adjustedBorrowedSum))
    .mul(100)
    .toFixed(2);
  return Number(healthFactor) < MAX_RATIO ? healthFactor : MAX_RATIO;
}
const healthFactor = getHealthFactor();
const recomputeHealthFactor = (tokenId, amount) => {
  if (!tokenId || !amount || !assets) return null;
  const asset = assets.find((a) => a.token_id === tokenId);
  const decimals = asset.metadata.decimals + asset.config.extra_decimals;
  const accountBorrowedAsset = account.borrowed.find(
    (a) => a.token_id === tokenId
  );
  const borrowedBalance = B(accountBorrowedAsset?.balance || 0);
  const balance = borrowedBalance.minus(expandToken(amount, decimals));
  const clonedAccount = clone(account);
  const newBalance = balance.lt(0) ? 0 : balance.toFixed();
  const updatedToken = {
    token_id: tokenId,
    balance: newBalance,
    shares: newBalance,
    apr: "0",
  };
  if (clonedAccount?.borrowed.length === 0) {
    clonedAccount.borrowed = [updatedToken];
  } else if (!accountBorrowedAsset) {
    clonedAccount.borrowed.push(updatedToken);
  } else {
    clonedAccount.borrowed = [
      ...clonedAccount.borrowed.filter((a) => a.token_id !== tokenId),
      updatedToken,
    ];
  }
  const adjustedCollateralSum = getAdjustedSum("collateral", account);
  const adjustedBorrowedSum = getAdjustedSum(
    "borrowed",
    amount === 0 ? account : clonedAccount
  );
  if (B(adjustedBorrowedSum).eq(0)) {
    return MAX_RATIO;
  } else {
    const newHealthFactor = B(adjustedCollateralSum)
      .div(B(adjustedBorrowedSum))
      .mul(100)
      .toFixed(2);

    return Number(newHealthFactor) < MAX_RATIO ? newHealthFactor : MAX_RATIO;
  }
};
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
const handleRepay = () => {
  const asset = assets.find((a) => a.token_id === selectedTokenId);

  if (!selectedTokenId || !amount || hasError) return;

  const finalAmount = isMax ? availableBalance : amount;
  const transactions = [];
  const expandedAmount = expandToken(
    finalAmount,
    asset.metadata.decimals + asset.config.extra_decimals
  );
  const repayTemplate = {
    Execute: {
      actions: [
        {
          Repay: {
            max_amount: !isMax ? expandedAmount.toFixed(0, 0) : undefined,
            token_id: selectedTokenId,
          },
        },
      ],
    },
  };

  const repayTransaction = {
    contractName: selectedTokenId,
    methodName: "ft_transfer_call",
    deposit: new Big("1").toFixed(),
    gas: expandToken(300, 12),
    args: {
      receiver_id: BURROW_CONTRACT,
      amount: expandToken(finalAmount, selectedTokenMeta.decimals).toFixed(
        0,
        0
      ),
      msg: JSON.stringify(repayTemplate),
    },
  };

  if (
    !(storageToken && storageToken.total != "0") &&
    !NO_STORAGE_DEPOSIT_CONTRACTS.includes(token_id)
  ) {
    transactions.push({
      contractName: selectedTokenId,
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

  transactions.push(repayTransaction);

  Near.call(transactions);
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
const remainBurrow = Big(
  Math.max(
    Number(
      Big(availableBalance || 0)
        .sub(amount || 0)
        .toFixed()
    ),
    0
  )
).toFixed(4);
const remainBurrow$ = Big(asset.price.usd || 0)
  .mul(remainBurrow)
  .toFixed(2);
/** logic end */
return (
  <Container>
    {/* load data */}
    {!hasData && (
      <Widget src="juaner.near/widget/ref_burrow-data" props={{ onLoad }} />
    )}
    <Widget
      src="juaner.near/widget/ref-icons"
      props={{ getWnearIcon, getCloseButtonIcon }}
    />
    {/* load icons */}
    <Widget src="juaner.near/widget/ref-common-api" props={{ onLoad }} />
    {/** modal */}
    <Modal style={{ display: showModal ? "block" : "none" }}>
      <div class="modal-header">
        <div class="title">Repay&nbsp; {selectedTokenMeta.symbol}</div>
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
              balance: availableBalance,
              balance$: availableBalance$,
              metadata: asset.metadata,
            }}
          />
          {hasError && (
            <p class="alert alert-danger mt-10" role="alert">
              Amount greater than available
            </p>
          )}
          <div class="template mt_25">
            <span class="title">Health Factor</span>
            <span class="value">{newHealthFactor || healthFactor}%</span>
          </div>
          <div class="template mt_25">
            <span class="title">Remaining Borrow</span>
            <span class="value">
              {remainBurrow}
              <span class="usd">(${remainBurrow$ || "0"})</span>
            </span>
          </div>
          <div
            class={`greenButton mt_25 ${Number(amount) ? "" : "disabled"}`}
            onClick={handleRepay}
          >
            Repay
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
