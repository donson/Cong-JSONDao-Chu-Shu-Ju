import { bitable, UIBuilder } from "@lark-base-open/js-sdk";
import { UseTranslationResponse } from 'react-i18next';

export default async function(uiBuilder: UIBuilder, { t }: UseTranslationResponse<'translation', undefined>) {
  uiBuilder.markdown(`
  > 欢迎使用【从JSON导入数据】
  > 1. 先选择数据表
  > 2. 然后输入JSON数组, 格式如下:
  \`\`\`
  [
    {
      "userId": 1,
      "id": 1,
      "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
    }
  ]
  \`\`\`
  `);
  uiBuilder.form((form) => ({
    formItems: [
      form.textArea('textArea', { label: '输入JSON数组', autoSize: { minRows: 10, maxRows: 20 } }),
    ],
    buttons: ['确定', '取消'],
  }), async ({ key, values }) => {
    if (key === '取消') {
      return
    }
    const { textArea } = values;
    let parsedJson: any[][] = []
    try {
      parsedJson = JSON.parse(textArea as string);
    } catch (error) {
      console.error('无效的JSON数据');
      // uiBuilder.markdown(`无效的JSON数据`);
      uiBuilder.message.error(`无效的JSON数据`)
    }
    // 判断是否为数组, 并且数组长度大于0
    if(!Array.isArray(parsedJson) || parsedJson.length === 0 || parsedJson[0] instanceof Object === false){
      return
    }
    uiBuilder.form((form) => ({
      formItems: [
        form.tableSelect('table', { label: '选择数据表' }),
        ...Object.keys(parsedJson[0]).map((item: any) => {
          return form.fieldSelect('select-'+item, { label: '选择存放【'+item+'】的列', sourceTable: 'table'});
        })
      ],
      buttons: ['确定', '取消'],
    }), async ({ key, values }) => {
      if(key === '取消') {
        return
      }
      const { table, ...vas } = values;
      let data = []
      for (const item of parsedJson) {
        let fields = {}
        for (const key of Object.keys(item)) {
          if(vas['select-'+key] !== undefined){
            fields[(vas['select-'+key].id as string)] = item[key].toString()
          }
        }
        data.push({fields})
      }
      try {
        await table.addRecords(data)
      } catch (error) {
        uiBuilder.message.error(t('添加失败')+': '+error.message)
      }
    });
  });
}