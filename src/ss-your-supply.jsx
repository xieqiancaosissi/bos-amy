const Container = styled.div`
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
const toAPY = (v) => Math.round(v * 100) / 100;
const shrinkToken = (value, decimals, fixed) => {
  return new Big(value).div(new Big(10).pow(decimals || 0)).toFixed(fixed);
};
const {
  assets,
  rewards,
  account,
  balances,
  showModalName,
  selectedTokenId,
  selectedTokenMeta,
  wnearbase64,
  closeButtonBase64,
} = state;
const { onLoadState } = props;
function changeSelectedToken(asset, type) {
  const { token_id, metadata } = asset;
  State.update({
    selectedTokenId: token_id,
    selectedTokenMeta: metadata,
    showModalName: type,
  });
}
function closeModal() {
  State.update({
    showModalName: "",
  });
}
const onLoad = (data) => {
  State.update(data);
};

const hasData = assets.length > 0 && rewards.length > 0 && account;
function getPortfolioRewards(type, token_id) {
  const targetFarm = account.farms.find((farm) => {
    return farm["farm_id"][type] == token_id;
  });
  if (targetFarm) {
    const asset = assets.find((a) => a.token_id == token_id);
    const rewards = targetFarm["rewards"] || [];
    const totalRewards =
      type == "Supplied" ? asset.farms[0].rewards : asset.farms[1].rewards;
    const result = rewards.map((reward) => {
      const { reward_token_id } = reward;
      const assetDecimals =
        asset.metadata.decimals + asset.config.extra_decimals;
      const rewardAsset = assets.find((a) => a.token_id == reward_token_id);
      const rewardTokenDecimals =
        rewardAsset.metadata.decimals + rewardAsset.config.extra_decimals;

      const boostedShares = Number(
        shrinkToken(reward.boosted_shares || 0, assetDecimals)
      );
      const totalBoostedShares = Number(
        shrinkToken(
          totalRewards[reward_token_id].boosted_shares || 0,
          assetDecimals
        )
      );
      const totalRewardsPerDay = Number(
        shrinkToken(
          totalRewards[reward_token_id].reward_per_day || 0,
          rewardTokenDecimals
        )
      );
      const rewardPerDay =
        (boostedShares / totalBoostedShares) * totalRewardsPerDay || 0;
      return { rewardPerDay, metadata: asset.metadata };
    });
    return result;
  }
  return [];
}
const depositedAssets = hasData
  ? new Set([
      ...account.supplied.map((a) => a.token_id),
      ...account.collateral.map((a) => a.token_id),
    ])
  : new Set();
// get portfolio deposited assets
let total_supplied_usd = Big(0);
const suppliedAssets = hasData
  ? [...depositedAssets].map((depositedTokenId) => {
      const asset = assets.find((a) => a.token_id === depositedTokenId);
      const netTvlMultiplier = asset.config.net_tvl_multiplier / 10000;
      const r = rewards.find((a) => a.token_id === asset.token_id);
      const totalApy =
        r.apyBase + r.apyRewardTvl * netTvlMultiplier + r.apyReward;

      const decimals = asset.metadata.decimals + asset.config.extra_decimals;
      const { can_use_as_collateral } = asset.config;

      const supplied = account.supplied.find(
        (s) => s.token_id === depositedTokenId
      );

      const depositedBalance = supplied
        ? Number(shrinkToken(supplied.balance, decimals))
        : 0;

      const collateral = account.collateral.find(
        (c) => c.token_id === depositedTokenId
      );

      const collateralBalance = collateral
        ? Number(shrinkToken(collateral.balance, decimals))
        : 0;

      const totalBalance = depositedBalance + collateralBalance;
      const usd = totalBalance * asset.price.usd;
      const collateralUsd = collateralBalance * asset.price.usd;
      total_supplied_usd = total_supplied_usd.plus(usd);
      const rewardsList =
        getPortfolioRewards("Supplied", depositedTokenId) || [];
      return (
        <tr>
          <td>
            <img
              src={asset.metadata.icon || wnearbase64}
              class="tokenIcon"
            ></img>
            {asset.metadata.symbol}
          </td>
          <td class="text-start">{toAPY(totalApy)}%</td>
          <td class="text-start">
            {rewardsList.length == 0
              ? "-"
              : rewardsList.map((reward) => {
                  const { rewardPerDay, metadata } = reward;
                  return (
                    <div class="flex_center">
                      {Big(rewardPerDay).toFixed(4)}
                      <img
                        class="rewardIcon ml_5"
                        src={metadata.icon || wnearbase64}
                      />
                    </div>
                  );
                })}
          </td>
          <td class="text-start">
            {collateralBalance.toFixed(4)}
            <span class="text_grey_color">(${collateralUsd.toFixed(2)})</span>
          </td>
          <td class="text-start">
            {totalBalance.toFixed(4)}
            <span class="text_grey_color">(${usd.toFixed(2)})</span>
          </td>
          <td class="flex-end">
            {!can_use_as_collateral ? null : (
              <Widget
                src="juaner.near/widget/ref-operation-button"
                props={{
                  clickEvent: () => {
                    changeSelectedToken(asset, "adjust");
                  },
                  buttonType: "solid",
                  actionName: "Adjust",
                  hoverOn: true,
                }}
              />
            )}
            &nbsp;&nbsp;
            <Widget
              src="juaner.near/widget/ref-operation-button"
              props={{
                clickEvent: () => {
                  changeSelectedToken(asset, "withdraw");
                },
                buttonType: "line",
                actionName: "Withdraw",
                hoverOn: true,
              }}
            />
          </td>
        </tr>
      );
    })
  : undefined;

if (suppliedAssets && suppliedAssets.length > 0) {
  onLoadState &&
    onLoadState({
      total_supplied_usd: total_supplied_usd.toFixed(),
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
    <div class="title">You Supplied</div>
    <table class="table click">
      <thead>
        <tr>
          <th scope="col" width="15%">
            Assets
          </th>
          <th scope="col" class="text-start" width="15%">
            Supply APY
          </th>
          <th scope="col" class="text-start" width="15%">
            Rewards
          </th>
          <th scope="col" class="text-start" width="15%">
            Collateral
          </th>
          <th scope="col" class="text-start" width="15%">
            You Supplied
          </th>
          <th scope="col"></th>
        </tr>
      </thead>
      <tbody>{suppliedAssets}</tbody>
    </table>
    {/** modal */}
    <Widget
      src="juaner.near/widget/ref-market-supply-adjust"
      props={{
        showModal: showModalName == "adjust",
        closeModal,
        selectedTokenId,
        selectedTokenMeta,
      }}
    />
    <Widget
      src="juaner.near/widget/ref-market-supply-withdraw"
      props={{
        showModal: showModalName == "withdraw",
        closeModal,
        selectedTokenId,
        selectedTokenMeta,
      }}
    />
  </Container>
);
