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
let BURROW_CONTRACT = "contract.main.burrow.near";
let ORACLE_CONTRACT = "priceoracle.near";
let MAX_RATIO = 10_000;
let B = Big();
B.DP = 60; // set precision to 60 decimals
const toAPY = (v) => Math.round(v * 100) / 100;
const clone = (o) => JSON.parse(JSON.stringify(o));
const shrinkToken = (value, decimals) => {
  return new Big(value).div(new Big(10).pow(decimals));
};
const expandToken = (value, decimals) => {
  return new Big(value).mul(new Big(10).pow(decimals));
};
const formatToken = (v) => Math.floor(v * 10_000) / 10_000;
const { showModal, closeModal, selectedTokenId, selectedTokenMeta } = props;
const {
  assets,
  rewards,
  balances,
  account,
  amount,
  hasError,
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
    newHealthFactor: "",
  });
}
/** base tool end */
const onLoad = (data) => {
  State.update(data);
};
/** logic start */
let apy = 0;
let cf = "-";
let asset;
const getApy = (asset) => {
  if (!asset && !rewards) return 0;
  const r = rewards.find((a) => a.token_id === asset.token_id);
  const totalApy = r.apyBase + r.apyRewardTvl + r.apyReward;
  return toAPY(totalApy);
};
if (selectedTokenId && assets) {
  const token = selectedTokenId === "NEAR" ? "wrap.near" : selectedTokenId;
  asset = assets.find((a) => a.token_id === token);
  apy = getApy(asset);
  cf = asset.config.volatility_ratio / 100;
}

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

/** logic end */
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
  const accountCollateralAsset = account.collateral.find(
    (a) => a.token_id === tokenId
  );
  const accountSuppliedAsset = account.supplied.find(
    (a) => a.token_id === tokenId
  );
  const collateralBalance = B(accountCollateralAsset?.balance || 0);
  const suppliedBalance = B(accountSuppliedAsset?.balance || 0);
  const amountDecimal = expandToken(amount || 0, decimals);

  const newBalance = decimalMin(
    collateralBalance.toFixed(),
    collateralBalance.plus(suppliedBalance).minus(amountDecimal).toFixed()
  ).toFixed();
  const clonedAccount = clone(account);

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
    amount === 0 ? account : clonedAccount
  );
  const adjustedBorrowedSum = getAdjustedSum("borrowed", account);
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
function computeWithdrawMaxAmount() {
  if (!assets || !selectedTokenId || !account) return "0";
  const asset = assets.find((a) => a.token_id === selectedTokenId);
  const { metadata, config } = asset;
  const decimals = metadata.decimals + config.extra_decimals;
  const assetPrice = asset.price
    ? B(asset.price.multiplier).div(B(10).pow(asset.price.decimals))
    : B(0);
  const accountSuppliedAsset = account.supplied.find(
    (a) => a.token_id === selectedTokenId
  );
  const suppliedBalance = new B(accountSuppliedAsset?.balance || 0);
  const supplied = Number(shrinkToken(suppliedBalance.toFixed(), decimals));

  const accountCollateralAsset = account.collateral.find(
    (a) => a.token_id === selectedTokenId
  );
  const collateralBalance = new B(accountCollateralAsset?.balance || 0);
  const collateral = Number(shrinkToken(collateralBalance.toFixed(), decimals));
  let maxAmount = suppliedBalance;
  if (collateralBalance.gt(0)) {
    const adjustedPricedDiff = decimalMax(
      0,
      B(adjustedCollateralSum).sub(adjustedBorrowedSum).toFixed()
    );
    const safeAdjustedPricedDiff = adjustedPricedDiff.mul(999).div(1000);

    const safePricedDiff = safeAdjustedPricedDiff
      .div(asset.config.volatility_ratio)
      .mul(10000);
    const safeDiff = safePricedDiff
      .div(assetPrice)
      .mul(expandToken(1, asset.config.extra_decimals))
      .toFixed(0);
    maxAmount = maxAmount.add(
      decimalMin(safeDiff, collateralBalance.toFixed()).toFixed()
    );
  }
  maxAmount = shrinkToken(maxAmount.toFixed(), decimals);
  const remain = Math.abs(
    Math.min(collateral, collateral + supplied - (amount || 0))
  );
  const remainBalance = B(remain).toFixed(4);
  const price = asset.price.usd || 0;
  const maxAmount$ = maxAmount.mul(price).toFixed(2);
  const remainBalance$ = B(remain).mul(price).toFixed(2);
  return [maxAmount.toFixed(), remainBalance, maxAmount$, remainBalance$];
}
function decimalMax(a, b) {
  a = new B(a);
  b = new B(b);
  return a.gt(b) ? a : b;
}

function decimalMin(a, b) {
  a = new B(a);
  b = new B(b);
  return a.lt(b) ? a : b;
}
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
const [availableBalance, remainBalance, availableBalance$, remainBalance$] =
  computeWithdrawMaxAmount();
return (
  <Container>
    {/* load data */}
    {!hasData && (
      <Widget src="juaner.near/widget/ref_burrow-data" props={{ onLoad }} />
    )}
    {/* load icons */}
    <Widget
      src="juaner.near/widget/ref-icons"
      props={{ getWnearIcon, getCloseButtonIcon }}
    />
    {/** modal */}
    <Modal style={{ display: showModal ? "block" : "none" }}>
      <div class="modal-header">
        <div class="title">Withdraw&nbsp; {selectedTokenMeta.symbol}</div>
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
            <span class="value">
              {newHealthFactor ? newHealthFactor : healthFactor}%
            </span>
          </div>
          <div class="template mt_25">
            <span class="title">Remaining Collateral</span>
            <span class="value">
              {remainBalance || "-"}
              <span class="usd">(${remainBalance$ || "0"})</span>
            </span>
          </div>
          <Widget
            src="juaner.near/widget/ref-withdraw-button"
            props={{
              onLoad,
              selectedTokenId,
              amount,
              hasError,
              account,
              onLoad,
              assets,
              availableBalance,
              storageToken,
              isMax,
            }}
          />
        </div>
      </div>
    </Modal>
    <Backdrop
      style={{ display: showModal ? "block" : "none" }}
      onClick={closeModal}
    ></Backdrop>
  </Container>
);
