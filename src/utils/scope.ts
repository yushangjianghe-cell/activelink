export interface ScopeConfig {
  mode: '全部启用' | '白名单' | '黑名单'
  list: {
    type: '私聊' | '群聊'
    id: string
  }[]
}

export function isInScope(channelId: string, scope: ScopeConfig): boolean {
  if (scope.mode === '全部启用') {
    return true
  }

  const isPrivate = channelId.startsWith('private:')
  const isGroup = !isPrivate

  let channelMatches = false
  let typeMatches = false

  for (const item of scope.list) {
    if (item.type === '私聊' && isPrivate) {
      if (!item.id || channelId === `private:${item.id}`) {
        channelMatches = true
        typeMatches = true
        break
      }
    } else if (item.type === '群聊' && isGroup) {
      if (!item.id) {
        channelMatches = true
        typeMatches = true
        break
      }
      const guildId = channelId.includes(':') ? channelId.split(':')[0] : channelId
      if (guildId === item.id || channelId === item.id) {
        channelMatches = true
        typeMatches = true
        break
      }
    }
  }

  if (scope.mode === '白名单') {
    return typeMatches && channelMatches
  } else {
    return !(typeMatches && channelMatches)
  }
}
