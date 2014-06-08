using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;

namespace TestReport.DAL
{
    public abstract class DataAccessBase
    {
        private DbConnection _dbConnetion;
        private bool _isConnectionValid;

        protected DataAccessBase(DbConnection dc)
        {
            this._dbConnetion = dc;
            ValidateConnection();
        }

        public DbConnection Connection
        {
            get
            {
                return _dbConnetion;
            }
            set
            {
                _dbConnetion = value;
                ValidateConnection();
            }
        }

        public bool IsConnectionValid { get { return _isConnectionValid; } }

        public abstract DataTable GetDataTable(string sqlString,CommandType type,List<DbParameter> parameters);
        
        private void ValidateConnection()
        {
            try
            {
                _dbConnetion.Open();
                _isConnectionValid = true;
            }
            catch
            {
                _isConnectionValid = false;
            }
            finally
            {
                _dbConnetion.Close();
            }
        }

    }

    public class SqlDataAccess : DataAccessBase
    {
        private SqlConnection _sqlCn;

        public SqlDataAccess(string connectionString)
            : base(new SqlConnection(connectionString)) 
        {
            this._sqlCn = new SqlConnection(connectionString);
        }


        public override DataTable GetDataTable(string sqlString, CommandType type, List<DbParameter> parameters)
        {
            DataTable dt = new DataTable();
            if (IsConnectionValid)
            {
                SqlCommand cmd = new SqlCommand();
                cmd.Connection = _sqlCn;
                cmd.CommandText = sqlString;
                cmd.CommandType = type;
                if (parameters != null && parameters.Count > 0)
                    cmd.Parameters.AddRange(parameters.ToArray());
                SqlDataAdapter adapter = new SqlDataAdapter(cmd);
                adapter.Fill(dt);
            }
            return dt;
        }

        public bool BulkCopy(string tableName, DataTable dt, int timeOut)
        {
            SqlBulkCopy sbc = new SqlBulkCopy(_sqlCn.ConnectionString, SqlBulkCopyOptions.UseInternalTransaction);
            sbc.BulkCopyTimeout = timeOut;
            try
            {
                sbc.DestinationTableName = tableName;
                sbc.WriteToServer(dt);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public bool ExecProc(string procName, List<SqlParameter> parameters)
        {
            try
            {
                if (IsConnectionValid)
                {
                    _sqlCn.Open();
                    using (SqlCommand cmd = new SqlCommand(procName, _sqlCn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        if (parameters != null && parameters.Count > 0)
                            cmd.Parameters.AddRange(parameters.ToArray());
                        cmd.ExecuteNonQuery();
                    }
                    _sqlCn.Close();
                    return true;
                }
            }
            catch
            {
                _sqlCn.Close();
                return false;
            }
            return false;
        }
    }
}
