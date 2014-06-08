using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data;

namespace TestReport.DAL
{
    public static class TableToJSON
    {
        public static string CreateJSON(DataTable dt)
        {
            StringBuilder JSONString = new StringBuilder();
            if (dt != null && dt.Rows.Count > 0)
            {
                JSONString.Append("{");
                JSONString.Append("\"Head\":[");
                for (int i = 0; i < dt.Rows.Count; i++)
                {
                    JSONString.Append("{");
                    for (int j = 0; j < dt.Columns.Count; j++)
                    {
                        if (j < dt.Columns.Count - 1)
                        {
                            JSONString.Append("\"" + dt.Columns[j].ColumnName.ToString()
                                + "\":" + "\"" + dt.Rows[i][j].ToString() + "\",");
                        }
                        else if (j == dt.Columns.Count - 1)
                        {
                            JSONString.Append("\"" + dt.Columns[j].ColumnName.ToString()
                                + "\":" + "\"" + dt.Rows[i][j].ToString() + "\"");
                        }
                    }
                    if (i == dt.Rows.Count - 1)
                        JSONString.Append("}");
                    else
                        JSONString.Append("},");
                }
                JSONString.Append("]}");
                return JSONString.ToString();
            }
            else
            {
                return string.Empty;
            }
        }
    }
}
