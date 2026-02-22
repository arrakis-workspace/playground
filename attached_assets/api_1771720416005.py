from dataclasses import dataclass, field
from pprint import pprint
from snaptrade import SnapTradeAggregator

@dataclass
class AggregatorApi:

    aggregator: SnapTradeAggregator = field(default=SnapTradeAggregator(), init=False)

    def check_status(self):
        response = self.aggregator.snaptrade.api_status.check()
        pprint(response.body)

    def create_account(self, user_id):
        register_response = self.aggregator.snaptrade.authentication.register_snap_trade_user(
            body={"userId": user_id})
        pprint(register_response.body)
        return register_response

    def redirect_uri(self, account, user_id):
        redirect_uri = self.aggregator.snaptrade.authentication.login_snap_trade_user(
            query_params={"userId": user_id, "userSecret": account.user_secret}
        )
        print(redirect_uri.body)
        return redirect_uri

    def delete_user(self, user_id):
        deleted_response = self.aggregator.snaptrade.authentication.delete_snap_trade_user(
            query_params={"userId": user_id}
        )
        pprint(deleted_response.body)

    def list_users(self):
        response = self.aggregator.snaptrade.authentication.list_snap_trade_users()
        pprint(response.body)
        return response.body

def test():
    print("I am here")
    snaptrade = AggregatorApi()
    snaptrade.check_status()
    user_id = 'nishit'
    users = snaptrade.list_users()
    if user_id not in users:
        snaptrade.create_account("nishit")
    else:
        snaptrade.delete_user("nishit")

if __name__ == '__main__':
    test()