<script lang="ts">
  import { mdiApi, mdiGithub } from "@mdi/js";
  import CircularProgress from "@smui/circular-progress";
  import { Svg } from "@smui/common/elements";
  import IconButton, { Icon } from "@smui/icon-button";
  import Tooltip, { Wrapper } from "@smui/tooltip";

  import { status } from "./stores";

  let runningAnalysis = true;

  status.subscribe((s) => {
    if (s.startsWith("Done")) {
      runningAnalysis = false;
    } else {
      runningAnalysis = true;
    }
  });
</script>

<header>
  <div class="inline">
    <img
      style="width:100px; margin-right: 50px;"
      src="zeno.png"
      alt="Square spiral logo next to 'Zeno'"
    />
    <div class="status inline">
      {#if runningAnalysis}
        <CircularProgress
          style="height: 32px; width: 32px; margin-right:20px"
          indeterminate
        />
        <span>{@html $status}</span>
      {/if}
    </div>
  </div>

  <div>
    <Wrapper>
      <IconButton href="https://cabreraalex.github.io/zeno/intro.html">
        <Icon component={Svg} viewBox="0 0 24 24">
          <path fill="currentColor" d={mdiApi} />
        </Icon>
      </IconButton>
      <Tooltip>read the documentation</Tooltip>
    </Wrapper>
    <Wrapper>
      <IconButton href="https://github.com/cabreraalex/zeno">
        <Icon component={Svg} viewBox="0 0 24 24">
          <path fill="currentColor" d={mdiGithub} />
        </Icon>
      </IconButton>
      <Tooltip>see the code on GitHub</Tooltip>
    </Wrapper>
  </div>
</header>

<style>
  header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding-top: 5px;
    padding-bottom: 5px;
    padding-right: 20px;
    padding-left: 20px;
    background: var(--mdc-theme-background);
    border-bottom: 1px solid #e0e0e0;
  }

  img {
    align-self: center;
  }

  .inline {
    display: flex;
    flex-direction: inline;
    align-items: center;
    justify-content: center;
  }
</style>
