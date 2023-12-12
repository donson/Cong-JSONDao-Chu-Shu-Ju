import { UIBuilder } from "@lark-base-open/js-sdk";
import { UseTranslationResponse } from 'react-i18next';

export default async function(uiBuilder: UIBuilder, { t }: UseTranslationResponse<'translation', undefined>) {
  // 展示关于如何使用该功能的信息
  uiBuilder.markdown(`
  > **欢迎使用【从JSON导入数据】插件**
  > 1. 输入JSON数组(一次最多支持5000条数据), 点击确定
  > 2. 选择数据表
  > 3. 选择JSON数组中的字段与数据表中的字段对应(不选择表示不用导入)
  > 4. [示例JSON数组](https://jsonplaceholder.typicode.com/users)
  `);

  // 处理导入JSON的逻辑，返回处理后的JSON数组或者空数组
  const handleJsonImport = async (values: any, uiBuilder: UIBuilder) => {
    const { textArea } = values;
    let parsedJson: any[] = [];

    try {
      parsedJson = JSON.parse(textArea as string);
    } catch (error) {
      console.error('无效的JSON数据');
      uiBuilder.markdown(`无效的JSON数据`);
      uiBuilder.message.error(`无效的JSON数据`);
      return [];
    }

    if (!Array.isArray(parsedJson) || parsedJson.length === 0 || !(parsedJson[0] instanceof Object)) {
      return [];
    }

    if (parsedJson.length > 5000) {
      uiBuilder.message.error(`单次新增记录不能超过 5000 条`);
      uiBuilder.markdown(`单次新增记录不能超过 5000 条`);
      return [];
    }

    return parsedJson;
  };

  // 处理表选择和数据组装的逻辑，返回选择的表和数据对象
  const handleTableSelection = async (values: any, parsedJson: any[], uiBuilder: UIBuilder) => {
    const { table, ...vas } = values;
    let data: any[] = [];

    for (const item of parsedJson) {
      let fields: any = {};

      for (const key of Object.keys(item)) {
        if (vas['select-' + key] !== undefined) {
          fields[vas['select-' + key].id as string] = item[key].toString() != '[object Object]' ? item[key].toString() : JSON.stringify(item[key]);
        }
      }

      data.push({ fields });
    }

    return { table, data };
  };

  // 创建输入JSON数组的表单
  uiBuilder.form((form) => ({
    formItems: [
      form.textArea('textArea', { label: '输入JSON数组', autoSize: { minRows: 10, maxRows: 20 } }),
    ],
    buttons: ['确定', '取消'],
  }), async ({ key, values }) => {
    if (key === '取消') {
      return;
    }

    const parsedJson = await handleJsonImport(values, uiBuilder);

    if (!parsedJson) {
      return;
    }

    // 创建选择数据表的表单
    uiBuilder.form((form) => ({
      formItems: [
        form.tableSelect('table', { label: '选择数据表' }),
        ...Object.keys(parsedJson[0]).map((item: any) => {
          return form.fieldSelect('select-' + item, { label: '选择存放['+item+']的列', sourceTable: 'table' });
        })
      ],
      buttons: ['确定', '取消'],
    }), async ({ key, values }) => {
      if (key === '取消') {
        return;
      }

      const { table, data } = await handleTableSelection(values, parsedJson, uiBuilder);

      try {
        await table.addRecords(data);
        uiBuilder.text(`成功插入 ${data.length} 条记录`);
        uiBuilder.message.success(`成功插入 ${data.length} 条记录`);
      } catch (error) {
        uiBuilder.message.error(t('添加失败') + ': ' + error.message);
      }
    });


  });
}
