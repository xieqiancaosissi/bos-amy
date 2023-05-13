const Container = styled.div`
  background: #1a2e33;
  .table {
    margin: 0;
  }
  .noBorder {
    border: none;
  }
  .table thead tr {
    height: 50px;
    border: hidden;
  }
  .table tbody tr {
    height: 50px;
  }
  .table.click tbody tr:hover {
    background: rgba(0, 0, 0, 0.1);
  }
  .table th {
    color: #7e8a93;
    font-size: 14px;
    vertical-align: middle;
  }
  .table td {
    color: #fff;
    font-size: 14px;
    vertical-align: middle;
    border: none;
  }
  .tokenIcon {
    width: 26px;
    height: 26px;
    border-radius: 100px;
    margin-right: 8px;
  }
  .rewardIcon {
    width: 16px;
    height: 16px;
    border-radius: 100px;
  }
  .text_red_color {
    color: #ff6ba9;
  }
  .ml_4_ne {
    margin-left: -4px;
  }
  .flex_center {
    display: flex;
    align-items: center;
  }
  .font-18 {
    font-size: 18px;
  }
  .flex-end {
    display: flex;
    align-items: center;
    justify-content: end;
    height: 50px;
  }
`;
/** base tool start  */
let accountId = context.accountId;
if (!accountId) {
  return <Widget src="juaner.near/widget/ref_account-signin" />;
}
let MAX_RATIO = 10_000;
let BURROW_CONTRACT = "contract.main.burrow.near";
let B = Big();
B.DP = 60; // set precision to 60 decimals

const toAPY = (v) => Math.round(v * 100) / 100;
const clone = (o) => JSON.parse(JSON.stringify(o));
const shrinkToken = (value, decimals) => {
  return B(value).div(B(10).pow(decimals || 0));
};

const expandToken = (value, decimals) => {
  return B(value).mul(B(10).pow(decimals || 0));
};

const formatToken = (v) => Math.floor(v * 10_000) / 10_000;

const power = (x, y) => {
  if (y === 0) {
    return 1;
  } else if (y % 2 === 0) {
    return power(x, parseInt(y / 2)) * power(x, parseInt(y / 2));
  } else {
    return x * power(x, parseInt(y / 2)) * power(x, parseInt(y / 2));
  }
};
const nFormat = (num, digits) => {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "K" },
    { value: 1e6, symbol: "M" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value);
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0";
};
const {
  rewards,
  account,
  balances,
  selectedTokenId,
  amount,
  hasError,
  assets,
  tabName,
  showModal,
  wnearbase64,
  closeButtonBase64,
} = state;
const hasData = assets.length > 0 && rewards.length > 0 && account;
/** base tool end */
const config = Near.view(BURROW_CONTRACT, "get_config");
const onLoad = (data) => {
  State.update(data);
};
const rewardsMap = rewards
  ? rewards.reduce((acc, cur) => {
      return {
        ...acc,
        [cur.token_id]: cur,
      };
    }, {})
  : {};
const assetsMap = assets
  ? assets.reduce((acc, cur) => {
      return {
        ...acc,
        [cur.token_id]: cur,
      };
    }, {})
  : {};
function getExtraApy(asset) {
  const asset_token_id = asset.token_id;
  const borrowFarm = asset.farms.find(
    (farm) =>
      farm["farm_id"]["Borrowed"] && Object.keys(farm.rewards || {}).length
  );
  if (!borrowFarm) return 0;
  const assetDecimals = asset.metadata.decimals + asset.config.extra_decimals;
  const totalBorrowUSD = toUsd(asset.borrowed.balance, asset);
  const rewards = borrowFarm.rewards;
  let userFarm;
  if (account) {
    userFarm = account.farms.find((farm) => {
      return (
        farm["farm_id"]["Borrowed"] == asset.token_id && farm.rewards.length
      );
    });
  }
  if (!userFarm) {
    return Object.keys(rewards)
      .map((reward_token_id) => {
        const farmData = rewards[reward_token_id];
        const { reward_per_day, boosted_shares } = farmData;
        const assetReward = assets.find(
          (asset) => asset.token_id == reward_token_id
        );
        const totalRewardsUsd = toUsd(
          B(reward_per_day).mul(365).toFixed(),
          assetReward
        );
        if (B(totalBorrowUSD).eq(0)) return 0;
        const apy = B(totalRewardsUsd).div(totalBorrowUSD).mul(100).toFixed();
        return apy;
      })
      .reduce((acc, cur) => acc + Number(cur), 0);
  } else {
    return userFarm.rewards
      .map((farmData) => {
        const { reward_token_id, boosted_shares, asset_farm_reward } = farmData;
        const assetReward = assets.find(
          (asset) => asset.token_id == reward_token_id
        );
        const borrowedShares = Number(
          shrinkToken(boosted_shares || 0, assetDecimals)
        );
        const totalBoostedShares = Number(
          shrinkToken(asset_farm_reward.boosted_shares, assetDecimals)
        );
        const boosterLogBase = Number(
          shrinkToken(
            asset_farm_reward.booster_log_base,
            config.booster_decimals
          )
        );
        const xBRRRAmount = Number(
          shrinkToken(
            account.booster_staking["x_booster_amount"] || 0,
            config.booster_decimals
          )
        );
        const log = Math.log(xBRRRAmount) / Math.log(boosterLogBase);
        const multiplier = log >= 0 ? 1 + log : 1;
        const userBorrowedBalance =
          account.borrowed.find((asset) => asset.token_id == asset_token_id)
            .balance || 0;
        const totalUserAssetUSD = toUsd(userBorrowedBalance, asset);
        const totalRewardsUsd = toUsd(
          B(asset_farm_reward.reward_per_day).mul(365).toFixed(),
          assetReward
        );
        return B(totalRewardsUsd)
          .mul(borrowedShares / totalBoostedShares)
          .mul(multiplier)
          .div(totalUserAssetUSD)
          .mul(100)
          .toFixed();
      })
      .reduce((acc, cur) => acc + Number(cur), 0);
  }
}
const toUsd = (balance, asset) =>
  asset.price?.usd
    ? Number(
        shrinkToken(
          balance,
          asset.metadata.decimals + asset.config.extra_decimals
        )
      ) * asset.price.usd
    : 0;
// get market can burrow assets
const can_burrow_assets = assets && assets.filter((a) => a.config.can_borrow);
const market_burrow_assets =
  can_burrow_assets &&
  can_burrow_assets.map((asset) => {
    const { token_id, metadata, price, config } = asset;
    const r = rewards.find((a) => a.token_id === asset.token_id);
    const borrowApy = r.apyBaseBorrow;
    const extraApy = getExtraApy(asset);
    const apy = borrowApy - extraApy;
    const token_usd_price = price && price.usd;
    const liquidity = nFormat(
      B(asset.availableLiquidity || 0)
        .mul(token_usd_price || 0)
        .toNumber(),
      2
    );
    const { volatility_ratio } = config;
    const cf = volatility_ratio / 100;

    const hasRewards = rewardsMap[token_id] && assetsMap[token_id];
    const rewardMap = hasRewards && rewardsMap[token_id];
    const rewardTokens = rewardMap && rewardMap.rewardTokensBorrow;
    const rewardTokensImg =
      rewardTokens &&
      rewardTokens.map((token_id, index) => {
        const metadata = assetsMap[token_id].metadata;
        return (
          <img
            class={`rewardIcon ${index > 0 ? "ml_4_ne" : ""}`}
            src={metadata.icon}
          ></img>
        );
      });
    return (
      <tr>
        <td>
          <img src={metadata.icon || wnearbase64} class="tokenIcon"></img>
          {metadata.symbol}
        </td>
        <td>{toAPY(apy)}%</td>
        <td class="text-white">
          {rewardTokensImg.length == 0 ? "-" : rewardTokensImg}
        </td>
        <td>{cf || "-"}%</td>
        <td>${liquidity}</td>
        <td class="flex-end">
          <Widget
            src="juaner.near/widget/ref-operation-button"
            props={{
              clickEvent: () => {
                handleSelect(token_id);
              },
              buttonType: "solid",
              actionName: "Burrow",
              hoverOn: true,
            }}
          />
        </td>
      </tr>
    );
  });
const handleSelect = (token_id) => {
  State.update({
    selectedTokenId: token_id,
    showModal: true,
  });
};
function closeModal() {
  State.update({
    showModal: false,
  });
}
function changeTab(tabName) {
  State.update({
    tabName,
  });
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
const selectedToken = (selectedTokenId && assetsMap[selectedTokenId]) || {};
const selectedTokenMeta = selectedToken.metadata || {};
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
    {/* market */}
    <div class="fw-bold text-white mt-3 font-18">
      <span class="text_red_color">Borrow</span> Market
    </div>
    <table class="table click noBorder">
      <thead>
        <tr>
          <th scope="col" width="15%">
            Assets
          </th>
          <th scope="col" class="text-start" width="15%">
            APY
          </th>
          <th scope="col" class="text-start" width="15%">
            Rewards
          </th>
          <th scope="col" class="text-start" width="15%">
            C.F.
          </th>
          <th scope="col" class="text-start" width="15%">
            Total Liquidity
          </th>
          <th scope="col" class="text-end"></th>
        </tr>
      </thead>
      <tbody>{market_burrow_assets}</tbody>
    </table>
    {/* Modal*/}
    <Widget
      src="juaner.near/widget/ref-market-burrow-burrow"
      props={{ selectedTokenId, selectedTokenMeta, showModal, closeModal }}
    />
  </Container>
);
