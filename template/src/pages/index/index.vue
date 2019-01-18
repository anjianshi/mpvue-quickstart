<template>
  <div class="container">
    <div class="usermotto">
      <div class="user-motto">
        \{{motto}}
      </div>
    </div>

    <form class="form-container">
      <input type="text" class="form-control" v-model="motto" placeholder="v-model" />
      <input type="text" class="form-control" v-model.lazy="motto" placeholder="v-model.lazy" />
    </form>
  </div>
</template>

<script>
export default {
  data{{#unless_eq lintConfig "airbnb"}} {{/unless_eq}}() {
    return {
      motto: 'Hello World'
    }{{#if_eq lintConfig "airbnb"}};{{/if_eq}}
  }
}{{#if_eq lintConfig "airbnb"}};{{/if_eq}}
</script>

<style scoped>
.userinfo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.userinfo-avatar {
  width: 128rpx;
  height: 128rpx;
  margin: 20rpx;
  border-radius: 50%;
}

.userinfo-nickname {
  color: #aaa;
}

.usermotto {
  margin-top: 150px;
}

.form-control {
  display: block;
  padding: 0 12px;
  margin-bottom: 5px;
  border: 1px solid #ccc;
}

{{#if vuex}}
.counter {
  display: inline-block;
  margin: 10px auto;
  padding: 5px 10px;
  color: blue;
  border: 1px solid blue;
}
{{/if}}
</style>
