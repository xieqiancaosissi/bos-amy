const Container = styled.div`
  width: 100%;
  .table th,
  .table td {
    color: rgb(126, 138, 147);
    font-size: 14px;
    vertical-align: middle;
    border: none;
  }
  .box_tabel {
    border-radius: 12px;
    background: #1a2e33;
    padding: 20px;
  }
  .title {
    font-weight: 700;
    font-size: 18px;
    color: #fff;
  }
  .title_top {
    font-weight: 700;
    font-size: 20px;
    color: #fff;
  }
  .mt_16 {
    margin-top: 16px;
  }
  .tokenIcon {
    width: 26px;
    height: 26px;
    border-radius: 100px;
    margin-right: 4px;
  }
  .rewardIcon {
    width: 16px;
    height: 16px;
    border-radius: 100px;
  }
  .text_grey_color {
    color: #7e8a93;
  }
  .mr_10 {
    margin-right: 10px;
  }
  .ml_5 {
    margin-left: 5px;
  }
  .topArea {
    padding: 0 25px 38px 25px;
  }
  .flexContainer {
    display: flex;
    align-items: center;
    margin-top: 12px;
  }
  .block {
    display: flex;
    flex-direction: column;
    border-right: 2px solid rgba(48, 67, 82, 0.5);
    padding-right: 30px;
    margin-right: 30px;
  }
  .block .t {
    font-size: 14px;
    color: #7e8a93;
  }
  .block .v {
    font-weight: 700;
    font-size: 26px;
    color: #fff;
  }
  .noBorder {
    border: none !important;
  }
  .mt_26 {
    margin-top: 26px;
  }
  .flex_center {
    display: flex;
    align-items: center;
  }
  .flex-end {
    display: flex;
    align-items: center;
    justify-content: end;
    height: 50px;
  }

  .claim_button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 26px;
    background: #00ffd1;
    border-radius: 6px;
    margin-left: 16px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    padding: 0 12px 0 12px;
  }
`;
const wnearbase64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAABmJLR0QA/wD/AP+gvaeTAAADvElEQVRYhbWYTUtjVxjH/9fRaFBaK3Q0ahCE3HTR0kWLL0g72nEh6NaAL+BivkIXHUpblWr9Ai78CIKgQqC1xYJNVnWwdiFCF9OS4CRRM2o7TRyw+XWRJk2uebuJ/uFC7jnP89xfzrnPOee5hmwIqJc0LOmxpA8keSW1SnpD0p+SLiT9JumZpF1Je4Zh3Nh5RiUQHcAKEMWeov/5td8FRBPwFZCwCWFVAvgCaKwWxAsc1ghh1RHwrl2QR8DlHYNk9BcwWinIMJC8J5CMEsDH5UDeAa7uGSSjC8DMfb6RA9Ik6WdJ79ma09r0q6R+wzBeS1JdTsdnhUACgYA8Ho8cDofGx8d1fn5u62mrq6tyuVwyTVPBYNDa/b6kT/NaSK8jBdPX4/EgKXsNDQ1xfX1d0Tz4/f48X9M0C5n9DTzMhVkpFjA3WOaam5srCxKPx+ns7LzlW0TLGZB6IGIHRhIrK0X5AZiZmSnoV0RRoF7AaKmguYFmZ2ezv+vq6tja2iros7m5iSSamppYWlqqBAZgRMA3lcJEo1Gmpqay9y0tLRwe5i/SZ2dntLe309bWxt7eHuFwuFKYrwX8UClMLBYjkUjQ19eXbevp6SEa/X//9Pl89Pb2cnx8DGAH5jsBf9iBATg5OaGrqyvbPjg4SDKZJBQKMTo6yunpadbfBsxzkd4rbMEAHBwc0NzcnO3z+XykUqlb/jZgrgTcVAMDsLGxgWEY2f7l5eVaYG6qHpmM5ufns/2GYbC+vl4tzJWA32uBSaVSTE9PZ22cTif7+/vVwDwX8H01MJFIhJGRESKRyK0Mc7vdRCIRuzDf1il9eLalo6MjDQwMqLu7Wx0dHXI6ndre3pbb7ZYkhcNhTUxMKJFI2An7TMBjOyOzu7tLa2srLpeLeDyeZ2vNsMnJSUKhUKUjM2xrb1pYWMDhcCAJv99f0N6aYdY9qoheAA8k2d+1nzx5Uuofsri4WHSDLaKl7GQB7RQ5z1iDud1uLi9Ln9WtGVYG5hXwdt7bA3xZyNI0zbx1ZGdnpyRIRslkkv7+/jwQr9dbyPTprVcZaKRAnRQIBDBNE5fLxdraWkUgGcViMcbGxmhoaMDr9RIMBq0mB4CjYG6RLtzuq16y6iXgKZnspAu4WsvZckoAH5UEyQEaAM7vCeSCcgVcASAT+OWOQQ4oNzUlgBqBz0mXE7XoFfCUYi+rTaiHwDLpldKOXgBLWNeRIjLKm+RBPZD0SNInkj5U+svVW5LelHQl6aXSX672Jf0o6SfDMP6pNP6/QZPF1Du0/sIAAAAASUVORK5CYII=";
let accountId = context.accountId;
if (!accountId) {
  return <Widget src="juaner.near/widget/ref_account-signin" />;
}
const toAPY = (v) => Math.round(v * 100) / 100;
const shrinkToken = (value, decimals, fixed) => {
  return new Big(value).div(new Big(10).pow(decimals || 0)).toFixed(fixed);
};
// get all assets data from burrow contracts
const {
  assets,
  rewards,
  account,
  balances,
  total_supplied_usd,
  total_burrowed_usd,
  selectedTokenId,
  selectedTokenMeta,
  type,
  showModal,
} = state;

const hasData = assets.length > 0 && rewards.length > 0 && account;
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
const onLoad = (data) => {
  State.update(data);
};
// get unclaimed rewards
const unclaimedRewardsMap = account
  ? account.farms?.reduce((prev, curr) => {
      for (const reward of curr.rewards) {
        const t = prev[reward.reward_token_id];
        if (t) {
          prev[reward.reward_token_id] = Big(t)
            .plus(Big(reward.unclaimed_amount))
            .toFixed();
        } else {
          prev[reward.reward_token_id] = Big(reward.unclaimed_amount).toFixed();
        }
      }
      return prev;
    }, {})
  : {};

const unclaimedRewards = Object.keys(unclaimedRewardsMap).map((id) => {
  const asset = assets.find((a) => a.token_id === id);
  const decimals = asset.metadata.decimals + asset.config.extra_decimals;
  return {
    id,
    unclaimed: shrinkToken(unclaimedRewardsMap[id], decimals, 4),
    symbol: asset.metadata.symbol,
    icon: asset.metadata.icon,
  };
});
// get net apy
const getNetAPY = (assets, account) => {
  const extraDaily = getExtraDaily(assets, account);
  const [gainCollateral, totalCollateral] = getGains(
    account,
    assets,
    "collateral"
  );
  const [gainSupplied, totalSupplied] = getGains(account, assets, "supplied");
  const [gainBorrowed] = getGains(account, assets, "borrowed");

  const gainExtra = extraDaily * 365;

  const netGains = gainCollateral + gainSupplied + gainExtra - gainBorrowed;
  const netTotals = totalCollateral + totalSupplied;
  const netAPY = (netGains / netTotals) * 100;

  return netAPY || 0;
};
function getExtraDaily(assets, account) {
  const farms = account.farms.filter(
    (farm) => !!(farm.farm_id["Supplied"] || farm.farm_id["Borrowed"])
  );
  const farmsRewards = farms
    .map((farm) => {
      const token_id = farm.farm_id.Borrowed || farm.farm_id.Supplied;
      const asset = assets.find((asset) => asset.token_id == token_id);
      const assetDecimals =
        asset.metadata.decimals + asset.config.extra_decimals;
      const rewards = farm.rewards.map((reward) => {
        const { reward_token_id, boosted_shares, asset_farm_reward } = reward;
        const assetReward = assets.find(
          (asset) => asset.token_id == reward_token_id
        );
        const rewardAssetDecimals =
          assetReward.metadata.decimals + assetReward.config.extra_decimals;
        const boostedShares = Number(
          shrinkToken(boosted_shares, assetDecimals)
        );
        const totalBoostedShares = Number(
          shrinkToken(asset_farm_reward.boosted_shares, assetDecimals)
        );
        const totalRewardsPerDay = Number(
          shrinkToken(asset_farm_reward.reward_per_day, rewardAssetDecimals)
        );
        const dailyAmount =
          (boostedShares / totalBoostedShares) * totalRewardsPerDay;
        return { dailyAmount, reward_token_id, token_id };
      });
      return rewards;
    })
    .flat();
  const extraDaily$ = farmsRewards.reduce((acc, cur) => {
    const { dailyAmount, reward_token_id } = cur;
    const assetReward = assets.find(
      (asset) => asset.token_id == reward_token_id
    );
    const price = assetReward.price.usd || 0;
    return acc + dailyAmount * price;
  }, 0);
  return extraDaily$ || 0;
}
function getGains(account, assets, source) {
  return account[source]
    .map((accountAsset) => {
      const { token_id, balance, apr } = accountAsset;
      const asset = assets.find((asset) => asset.token_id == token_id);
      const netTvlMultiplier = asset.config.net_tvl_multiplier / 10000;
      const balanceUSD = toUsd(balance, asset);
      return [balanceUSD * (withNetTvlMultiplier ? netTvlMultiplier : 1), apr];
    })
    .reduce(
      ([gain, sum], [balance, apr]) => [gain + balance * apr, sum + balance],
      [0, 0]
    );
}
const toUsd = (balance, asset) =>
  asset?.price?.usd
    ? Number(
        shrinkToken(
          balance,
          asset.metadata.decimals + asset.config.extra_decimals
        )
      ) * asset.price.usd
    : 0;
let apyNetValue;
if (assets && account && rewards) {
  const netAPY = getNetAPY(assets, account);
  const r = rewards[0].apyRewardTvl || 0;
  apyNetValue = Big(netAPY || 0)
    .plus(r)
    .toFixed(2);
}

const handleClaimAll = () => {
  Near.call({
    contractName: "contract.main.burrow.near",
    methodName: "account_farm_claim_all",
  });
};
// get portfolio borrowed assets
let yourSuppliedUSD;
let yourBurrowedUSD;
const big_total_supplied_usd = Big(total_supplied_usd || 0);
if (big_total_supplied_usd.gt(0)) {
  yourSuppliedUSD = big_total_supplied_usd.lt(0.01)
    ? "<$0.01"
    : "$" + big_total_supplied_usd.toFixed(2);
}
const big_total_burrowed_usd = Big(total_burrowed_usd || 0);
if (big_total_burrowed_usd.gt(0)) {
  yourBurrowedUSD = big_total_burrowed_usd.lt(0.01)
    ? "<$0.01"
    : "$" + big_total_burrowed_usd.toFixed(2);
}
function closeModal() {
  State.update({
    showModal: false,
  });
}
return (
  <Container>
    {/* load data */}
    {!hasData && (
      <Widget src="juaner.near/widget/ref_burrow-data" props={{ onLoad }} />
    )}
    {/* Your Lending */}
    <div class="topArea">
      <div class="title_top">Yours</div>
      <div class="flexContainer">
        {!accountId ? null : (
          <div class="block">
            <label class="t">Net APY</label>
            <span class="v">{apyNetValue || "0"}%</span>
          </div>
        )}
        <div class="block">
          <label class="t">Supplied</label>
          <span class="v">{yourSuppliedUSD || "$0"}</span>
        </div>
        <div class="block">
          <label class="t">Borrowed</label>
          <span class="v">{yourBurrowedUSD || "$0"}</span>
        </div>
        <div class="block noBorder">
          <label class="t">Health Factor</label>
          <span class="v" style={{ color: "#00C595" }}>
            <Widget src="juaner.near/widget/ref-burrow-healthFactor"></Widget>
          </span>
        </div>
      </div>
      <div class="block mt_26 noBorder">
        <label class="t">Unclaimed Rewards</label>
        <div>
          <div class="flex_center">
            {unclaimedRewards.length > 0 ? (
              <>
                {unclaimedRewards.map((reward) => (
                  <div class="flex_center">
                    <span class="v mr_10">{reward.unclaimed}</span>
                    <img src={reward.icon} class="rewardIcon"></img>
                  </div>
                ))}
                <div class="claim_button" onClick={handleClaimAll}>
                  Claim
                </div>
              </>
            ) : (
              <span class="v mr_10">0</span>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* supply area */}
    <div class="box_tabel">
      {/*yours */}
      <Widget
        src="juaner.near/widget/ss-your-supply"
        props={{ onLoadState: onLoad }}
      />
      {/*market */}
      <Widget src="juaner.near/widget/ref-market-supply-assets" />
    </div>
    {/* burrow area */}
    <div class="box_tabel mt_16">
      {/* yours */}
      <Widget
        src="juaner.near/widget/ss-your-burrow"
        props={{ onLoadState: onLoad }}
      />
      {/*market */}
      <Widget src="juaner.near/widget/ref-market-burrow-assets" />
    </div>
  </Container>
);
