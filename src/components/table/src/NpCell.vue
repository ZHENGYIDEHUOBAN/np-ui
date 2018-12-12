<script>
export default {
  name: 'NpCell',
  props: {
    render: {
      type: Function
    },
    row: {},
    column: {},
    index: {}
  },
  render(h, ctx) {
    const params = {
      row: this.row,
      index: this.index
    };
    if (this.column) {
      params.column = this.column;
      params.value = this.row[this.column.field];
    };
    return this.render(h, params);
  }
};
</script>

<style>
</style>
