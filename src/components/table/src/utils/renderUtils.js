const mergeCellText = (h, col, scope) => {
  if (!col.slotCell && !col.renderCell) {
    return (
      <div
        v-show={!(col.editor && col.editor.type === 'checkbox')}
        class="cell-text" title={typeof this.renderText(scope, col) !== 'string' ? '' : this.renderText(scope, col).replace(/<[^>]+>/g, '')}
        style={[col.nowrap ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : '', this.groupField.length > 0 && index === 1 ? { cursor: 'pointer' } : '']}
        column-field={col.field}
        domPropsInnerHTML={this.renderText(scope, col)}
        native-on-click={this.toggleExpand(scope.row, index)}>
      </div>
    );
  }
  if (col.slotCell) {
    return (
      <div
        v-show={!(col.editor && col.editor.type === 'checkbox')}
        class="cell-text" title={typeof this.renderText(scope, col) !== 'string' ? '' : this.renderText(scope, col).replace(/<[^>]+>/g, '')}
        style={col.nowrap ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : ''}
        column-field={col.field}
        v-slot={this.renderText(scope, col)}>
      </div>
    );
  }
  if (col.renderCell) {
    return (
      <np-cell render={col.renderCell} row={scope.row} index={scope.$index} column={col}></np-cell>
    );
  }
};

export {
  mergeCellText
};
