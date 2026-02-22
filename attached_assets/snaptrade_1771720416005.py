from dataclasses import dataclass, field
from snaptrade_client import SnapTrade

@dataclass
class SnapTradeAggregator:
    #consumer_key: str = field(default='gNIkxUIyCmbxONE4rPRqSQMMFPj3nq1EEnY3aXGJQspHDYT6jh', init=False)
    #client_id: str = field(default='NISHIT-TEST', init=False)
    consumer_key: str = 'gNIkxUIyCmbxONE4rPRqSQMMFPj3nq1EEnY3aXGJQspHDYT6jh'
    client_id: str = 'NISHIT-TEST'
    snaptrade: SnapTrade = field(default=SnapTrade(consumer_key=consumer_key, client_id=client_id), init=False)