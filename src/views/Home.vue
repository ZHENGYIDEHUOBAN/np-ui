<template>
  <div class="home">
     <np-render-table
      :height="config.height"
      :multiple="true"
      @current-change="({ currentRow }) => config.currentRow = currentRow"
      @selection-change="({ selection }) => config.selection = selection"
      v-loading="config.loading"
      :columns="config.columns"
      :data="config.data"
      name="config">
    </np-render-table>
  </div>
</template>

<script>

export default {
  name: 'home',
  data() {
    return {
      config: {
        height: '',
        currentRow: null,
        selection: [],
        loading: false,
        columns: [
          {
            field: 'Name', header: '菜单名称', headerI18n: '', sortable: true, visible: true, nowrap: true, treeField: true, fixed: true,
            renderCell: (h, { row, column, value, index }) => {
              return (
                <span><i class={`fa ${row.Icon}`} style={[{ fontSize: '14px' }, row.Icon ? { marginRight: '3px' } : '']}></i>{value}</span>
              );
            }
          },
          { field: 'Keyword', header: '关键字', headerI18n: '', sortable: true, visible: true, nowrap: true, fixed: true },
          { field: 'Sequ', header: '排序', headerI18n: '', sortable: true, visible: true, nowrap: true, fixed: true },
          { field: 'Type', header: '类型', headerI18n: '', sortable: true, visible: true, nowrap: true, fixed: true }
        ],
        data: [
          { Name: '111', Keyword: '222', Sequ: '333', Type: '444' },
          { Name: '111', Keyword: '222', Sequ: '333', Type: '444' },
          { Name: '111', Keyword: '222', Sequ: '333', Type: '444' },
          { Name: '111', Keyword: '222', Sequ: '333', Type: '444' },
          { Name: '111', Keyword: '222', Sequ: '333', Type: '444' }
        ]
      }
    };
  }
};
</script>
